export interface ApprovedModule {
  readonly id: string;
  readonly title: string;
  readonly topics: readonly { readonly id: string; readonly title: string }[];
}

export const APPROVED_CONTENT_VERSION_ID = "version-baya-modules-1-to-3-v1";

export const approvedCurriculum: readonly ApprovedModule[] = Object.freeze([
  Object.freeze({
    id: "module-1",
    title: "Pagkilala sa Baybayin",
    topics: Object.freeze([
      Object.freeze({
        id: "topic-1-1",
        title: "Kasaysayan at Kahalagahan ng Baybayin",
      }),
      Object.freeze({ id: "topic-1-2", title: "Baybayin: Isang Silabaryo (Pantigan)" }),
      Object.freeze({
        id: "topic-1-3",
        title: "Ang 17 Simbolo ng Baybayin",
      }),
      Object.freeze({ id: "topic-1-4", title: "Magkaibang Letra, Iisang Simbolo?" }),
      Object.freeze({ id: "topic-1-5", title: "Paano naman ang Da at Ra?" }),
    ]),
  }),
  Object.freeze({
    id: "module-2",
    title: "Baybayin Characters",
    topics: Object.freeze([
      Object.freeze({ id: "topic-2-1", title: "Ang mga Patinig" }),
      Object.freeze({ id: "topic-2-2", title: "Kilalanin ang mga Katinig" }),
    ]),
  }),
  Object.freeze({
    id: "module-kudlit",
    title: "Kudlit",
    topics: Object.freeze([
      Object.freeze({ id: "topic-kudlit-upper", title: "Kudlit sa Itaas" }),
      Object.freeze({ id: "topic-kudlit-lower", title: "Kudlit sa Ibaba" }),
    ]),
  }),
  Object.freeze({
    id: "module-3",
    title: "Pagsusulat ng Baybayin",
    topics: Object.freeze([
      Object.freeze({ id: "topic-3-1", title: "Mga Patinig" }),
      Object.freeze({ id: "topic-3-2", title: "Mga Katinig" }),
    ]),
  }),
]);
