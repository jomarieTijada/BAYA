import { DatabaseSync } from 'node:sqlite';
import { readProgressSnapshot } from '../localProgressSnapshot';
import type { DatabaseConnection } from '../../../database/types';
let raw:DatabaseSync;
let db:DatabaseConnection;
beforeEach(()=>{
 raw=new DatabaseSync(':memory:');
 db={
  execAsync:async(sql)=>{raw.exec(sql);},
  runAsync:async(sql,params=[])=>{const r=raw.prepare(sql).run(...params as any[]);return {changes:Number(r.changes),lastInsertRowId:Number(r.lastInsertRowid)};},
  getFirstAsync:async<T,>(sql:string,params:unknown[]=[])=>raw.prepare(sql).get(...params as any[]) as T ?? null,
  getAllAsync:async<T,>(sql:string,params:unknown[]=[])=>raw.prepare(sql).all(...params as any[]) as T[],
 };
 raw.exec(`create table profiles(profile_id text,auth_user_id text,display_name text,role text,created_at text,updated_at text);
 create table local_app_state(state_key text,state_value text);
 create table activity_attempts(learner_profile_id text,activity_id text,result_status text,attempted_at text);
 insert into profiles values('one',null,'Learner One','learner','2026-01-01','2026-01-01');
 insert into local_app_state values('active_learner_profile_id','one');
 insert into activity_attempts values
 ('one','topic-1-1','completed','2026-01-02T00:00:00Z'),
 ('one','topic-1-1','completed','2026-01-01T00:00:00Z'),
 ('one','topic-3-1','valid','2026-01-01T00:00:00Z'),
 ('one','unapproved','completed','2026-01-01T00:00:00Z'),
 ('two','topic-1-2','completed','2026-01-01T00:00:00Z');`);
});
afterEach(()=>raw.close());
it('reads only approved completion for the captured local profile without modifying SQLite',async()=>{
 const before=raw.prepare('select * from activity_attempts').all();
 const snapshot=await readProgressSnapshot(db);
 expect(snapshot.localProfileId).toBe('one');expect(snapshot.displayName).toBe('Learner One');
 expect(snapshot.completed).toEqual([{topicKey:'topic-1-1',completedAt:'2026-01-01T00:00:00.000Z'}]);
 expect(raw.prepare('select * from activity_attempts').all()).toEqual(before);
});
it('rejects missing identity rather than borrowing another learner',async()=>{
 raw.exec('delete from local_app_state');await expect(readProgressSnapshot(db)).rejects.toEqual({code:'learner_required'});
});
it('rejects a corrupt completion time without erasing saved progress',async()=>{
 raw.exec("update activity_attempts set attempted_at='invalid' where activity_id='topic-1-1'");
 await expect(readProgressSnapshot(db)).rejects.toThrow('Invalid saved completion timestamp');
 expect(raw.prepare('select count(*) as n from activity_attempts').get()?.n).toBe(5);
});
