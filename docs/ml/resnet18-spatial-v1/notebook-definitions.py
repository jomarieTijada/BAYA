def prepare(path):
    with Image.open(path) as im:
        rgba = im.convert('RGBA')
        bg = Image.new('RGBA', rgba.size, (255,255,255,255))
        bg.alpha_composite(rgba)
        gray = np.asarray(bg.convert('L'))
    ys, xs = np.where(gray < 225)
    if len(xs) < 2:
        M = np.array([[1,0,0],[0,1,0]], dtype=np.float32)
        return np.zeros((IMG_SIZE,IMG_SIZE), np.float32), M, gray.shape[::-1]
    cx, cy = (xs.min()+xs.max())/2, (ys.min()+ys.max())/2
    side = max(float(np.ptp(xs)+1),float(np.ptp(ys)+1),10.0)*1.34
    scale = IMG_SIZE / side
    M = np.float32([[scale,0,IMG_SIZE/2-scale*cx],[0,scale,IMG_SIZE/2-scale*cy]])
    resized = cv2.warpAffine(gray,M,(IMG_SIZE,IMG_SIZE),flags=cv2.INTER_LINEAR,borderValue=255)
    ink = (255.0-resized.astype(np.float32))/255.0
    return ink,M,gray.shape[::-1]

class BayaResNet18(nn.Module):
    def __init__(self,pretrained=True):
        super().__init__()
        net=resnet18(weights=ResNet18_Weights.DEFAULT if pretrained else None)
        self.stem=nn.Sequential(net.conv1,net.bn1,net.relu,net.maxpool,net.layer1,net.layer2)
        self.layer3=net.layer3
        self.layer4=net.layer4
        self.pool=nn.AdaptiveAvgPool2d(1)
        self.class_head=nn.Linear(512,63)
        self.base_head=nn.Linear(512,len(BASES))
        self.modifier_head=nn.Linear(512,len(MODIFIERS))
        self.box_head=nn.Sequential(nn.Linear(512,4),nn.Sigmoid())
        self.xy_head=nn.Conv2d(256,1,1)
        grid=torch.linspace(0,1,40)
        yy,xx=torch.meshgrid(grid,grid,indexing='ij')
        self.register_buffer('grid_x',xx.reshape(1,-1),persistent=False)
        self.register_buffer('grid_y',yy.reshape(1,-1),persistent=False)
    def forward(self,x):
        f3=self.layer3(self.stem(x))
        f4=self.layer4(f3)
        v=self.pool(f4).flatten(1)
        heat=F.interpolate(self.xy_head(f3),size=(40,40),mode='bilinear',align_corners=False)
        prob=torch.softmax(heat.flatten(1),dim=1)
        coords=torch.stack([(prob*self.grid_x).sum(1),(prob*self.grid_y).sum(1)],dim=1)
        return self.class_head(v),self.base_head(v),self.modifier_head(v),coords,self.box_head(v)
