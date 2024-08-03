import { db, connection } from './db';
import { tasks } from './db/schema';


await db.insert(tasks).values([{
  userId: '5844472',
  description: 'this is a test task!',
}]);

await connection.end();

