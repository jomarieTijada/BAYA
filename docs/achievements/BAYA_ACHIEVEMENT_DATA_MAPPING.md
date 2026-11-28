# Evidence and evaluators

The service loads records by learner ID. The pure evaluator applies these conditions after validating saved attempts.

| ID | Condition | Persisted source |
|---|---|---|
| first_step | {"type": "topics", "ids": [], "minimum": 1} | activity_attempts / approvedCurriculum |
| time_traveler | {"type": "topics", "ids": ["topic-1-1"]} | activity_attempts / approvedCurriculum |
| script_sleuth | {"type": "topics", "ids": ["topic-1-2"]} | activity_attempts / approvedCurriculum |
| seventeen_stars | {"type": "topics", "ids": ["topic-1-3"]} | activity_attempts / approvedCurriculum |
| heritage_keeper | {"type": "module", "id": "module-1"} | activity_attempts / approvedCurriculum |
| vowel_voyager | {"type": "topics", "ids": ["topic-2-1"]} | activity_attempts / approvedCurriculum |
| consonant_companion | {"type": "topics", "ids": ["topic-2-2"]} | activity_attempts / approvedCurriculum |
| character_champion | {"type": "module", "id": "module-2"} | activity_attempts / approvedCurriculum |
| kudlit_climber | {"type": "topics", "ids": ["topic-kudlit-upper"]} | activity_attempts / approvedCurriculum |
| kudlit_diver | {"type": "topics", "ids": ["topic-kudlit-lower"]} | activity_attempts / approvedCurriculum |
| three_vowels | {"type": "exploration", "group": "vowel", "minimum": 3} | achievement_events / canonical character ID |
| first_feather | {"type": "exploration", "group": "base-consonant", "minimum": 1} | achievement_events / canonical character ID |
| seven_symbols | {"type": "exploration", "group": "base-consonant", "minimum": 7} | achievement_events / canonical character ID |
| fourteen_feathers | {"type": "exploration", "group": "base-consonant", "minimum": 14} | achievement_events / canonical character ID |
| symbol_collector | {"type": "exploration", "group": "foundation", "minimum": 17} | achievement_events / canonical character ID |
| upper_mark_explorer | {"type": "exploration", "group": "upper-kudlit", "minimum": 5} | achievement_events / canonical character ID |
| lower_mark_explorer | {"type": "exploration", "group": "lower-kudlit", "minimum": 5} | achievement_events / canonical character ID |
| kudlit_explorer | {"type": "module", "id": "module-kudlit"} | activity_attempts / approvedCurriculum |
| writing_pathfinder | {"type": "topics", "ids": ["topic-3-1"]} | activity_attempts / approvedCurriculum |
| writing_foundation | {"type": "topics", "ids": ["topic-3-2"]} | activity_attempts / approvedCurriculum |
| first_sound | {"type": "metric", "metric": "recordings", "minimum": 1} | achievement_events / recording ID |
| sound_collector | {"type": "metric", "metric": "recordings", "minimum": 5} | achievement_events / recording ID |
| listening_legend | {"type": "metric", "metric": "recordings", "minimum": 15} | achievement_events / recording ID |
| pair_pioneer | {"type": "metric", "metric": "pairs", "minimum": 1} | local_app_state / validated SetAttempt.responses |
| triple_connection | {"type": "metric", "metric": "boardCorrect", "minimum": 3} | local_app_state / validated SetAttempt.responses |
| sound_sleuth | {"type": "metric", "metric": "audioQuestions", "minimum": 5} | local_app_state / validated SetAttempt.responses |
| sound_scholar | {"type": "metric", "metric": "audioQuestions", "minimum": 15} | local_app_state / validated SetAttempt.responses |
| baybayin_decoder | {"type": "metric", "metric": "decodeQuestions", "minimum": 10} | local_app_state / validated SetAttempt.responses |
| symbol_builder | {"type": "metric", "metric": "buildQuestions", "minimum": 10} | local_app_state / validated SetAttempt.responses |
| perfect_pairboard | {"type": "metric", "metric": "perfectBoard", "minimum": 1} | local_app_state / validated SetAttempt.responses |
| first_stroke | {"type": "metric", "metric": "writingAttempts", "minimum": 1} | local_app_state / validated SetAttempt.responses + writing_attempts joined to activity_attempts |
| first_recognition | {"type": "metric", "metric": "writingSuccess", "minimum": 1} | local_app_state / validated SetAttempt.responses + writing_attempts joined to activity_attempts |
| little_writer | {"type": "metric", "metric": "writingQuestions", "minimum": 3} | local_app_state / validated SetAttempt.responses |
| growing_writer | {"type": "metric", "metric": "writingQuestions", "minimum": 5} | local_app_state / validated SetAttempt.responses |
| confident_writer | {"type": "metric", "metric": "writingQuestions", "minimum": 10} | local_app_state / validated SetAttempt.responses |
| master_of_strokes | {"type": "metric", "metric": "writingQuestions", "minimum": 20} | local_app_state / validated SetAttempt.responses |
| baybayin_writing_hero | {"type": "metric", "metric": "writingQuestions", "minimum": 25} | local_app_state / validated SetAttempt.responses |
| base_character_artist | {"type": "metric", "metric": "baseTargets", "minimum": 5} | local_app_state / validated SetAttempt.responses |
| upper_kudlit_artist | {"type": "metric", "metric": "upperTargets", "minimum": 3} | local_app_state / validated SetAttempt.responses |
| lower_kudlit_artist | {"type": "metric", "metric": "lowerTargets", "minimum": 3} | local_app_state / validated SetAttempt.responses |
| checkpoint_clearer | {"type": "metric", "metric": "checkpoints", "minimum": 1} | local_app_state / validated SetAttempt.responses |
| checkpoint_explorer | {"type": "metric", "metric": "checkpoints", "minimum": 3} | local_app_state / validated SetAttempt.responses |
| baybayin_trailblazer | {"type": "metric", "metric": "allCheckpoints", "minimum": 1} | local_app_state / validated SetAttempt.responses |
| second_chance_champion | {"type": "metric", "metric": "retry", "minimum": 1} | local_app_state / validated SetAttempt.responses |
| practice_makes_progress | {"type": "metric", "metric": "improvement", "minimum": 1} | local_app_state / validated SetAttempt.responses |
| welcome_back_learner | {"type": "metric", "metric": "resume", "minimum": 1} | local_app_state / validated SetAttempt.responses + learner resume event |
| baya_story_explorer | {"type": "metric", "metric": "story", "minimum": 1} | achievement_events / story session |
| story_revisited | {"type": "metric", "metric": "replay", "minimum": 1} | achievement_events / story session |
| offline_adventurer | {"type": "metric", "metric": "offline", "minimum": 1} | achievement_events / offline + completed SetAttempt |
| values_hero | {"type": "metric", "metric": "values", "minimum": 1} | No approved values activity |

## Finalization verification

The offline completion observer runs after an actual saved cursor advance. It checks the completed scoreable attempt, offline connectivity before and after the worker reply, and verified resource state. The stamped event references the learner and attempt. Reopening an already completed result cannot create new offline completion evidence. Historical DE and RE deferrals preserve their null scores. Current submissions require the mapped recording. The populated version-five upgrade test snapshots profiles, partial progress, writing, scored assessments, Settings acknowledgement, workspace and synchronization rows before and after Migration 006 and database reopen.
