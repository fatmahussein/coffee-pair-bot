import { pool } from './db.js';

export async function runPairing(client, channel) {
  const month = new Date().toISOString().slice(0, 7); // "2026-03"

  const result = await pool.query('SELECT user_id FROM participants');
  let participants = result.rows.map(row => row.user_id);

    if (participants.length === 0) {
    await channel.send(" No participants have joined the channel yet.");
    return;
  }
  
  if (participants.length < 2) {
    await channel.send('Not enough members to create pairs.');
    return;
  }

  // shuffle (Fisher–Yates)
  for (let i = participants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [participants[i], participants[j]] = [participants[j], participants[i]];
  }

  let pairs = [];

  for (let i = 0; i < participants.length; i += 2) {
    const user1Id = participants[i];
    const user2Id = participants[i + 1];

    if (user2Id) {
      const user1 = await client.users.fetch(user1Id);
      const user2 = await client.users.fetch(user2Id);

      await user1.send(`☕ You’ve been paired with <@${user2Id}>! Say hello 👋`);
      await user2.send(`☕ You’ve been paired with <@${user1Id}>! Say hello 👋`);

      // store each pair
      await pool.query(
        'INSERT INTO pairings(user1_id, user2_id, month) VALUES($1, $2, $3)',
        [user1Id, user2Id, month]
      );

      pairs.push(`👥 <@${user1Id}> ↔ <@${user2Id}>`);
    } else {
      pairs.push(`👀 <@${user1Id}> (Sorry! No partner this round)`);
    }
  }

  await channel.send(`☕ Pairings for this month have been sent privately to your DMs!`);
}