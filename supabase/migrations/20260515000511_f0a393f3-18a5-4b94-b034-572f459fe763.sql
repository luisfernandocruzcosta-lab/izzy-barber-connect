DROP POLICY IF EXISTS "Authenticated can use realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can receive realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can subscribe to realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can read realtime" ON realtime.messages;