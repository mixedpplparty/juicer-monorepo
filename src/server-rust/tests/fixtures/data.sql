-- Synthetic data only. Include every table and binary/null/array edge cases.
INSERT INTO servers VALUES ('one','2020-02-03 04:05:06',true),('two','2021-03-04 05:06:07',false);
INSERT INTO categories(server_id,name) VALUES ('one','category'),('two','other');
INSERT INTO tags(server_id,name) VALUES ('one','tag'),('two','다른 태그');
INSERT INTO roles_categories(server_id,name,is_verification) VALUES
  ('one','renamed verification',true),('one','verification',false),
  ('two','verification',false),('two','verification',false);
INSERT INTO roles VALUES ('r1','one',1,true,'description'),('r2','two',NULL,false,NULL);
INSERT INTO games(server_id,category_id,name,description,thumbnail,channels) VALUES
  ('one',1,'topic','unicode 한글',decode('0001ff7f','hex'),ARRAY['channel-one','channel-two']),
  ('two',NULL,'topic two',NULL,NULL,NULL);
INSERT INTO games_roles VALUES (1,'r1'),(2,'r2');
INSERT INTO games_tags VALUES (1,1),(2,2);
