const fs = require('fs');
const sql = fs.readFileSync('c:/www/brightmindapi/schema.sql', 'utf8');
const lines = sql.split('\n');
const lessons = [];
for (const line of lines) {
  const m = line.match(/\((\d+),\s*(\d+),'([^']+)','([^']+)','([^']+)','(\[[^\]]+\])',(\d+),(\d+),'([^']+)'\)/);
  if (m) {
    lessons.push({
      id: Number(m[1]),
      subject_id: Number(m[2]),
      slug: m[3],
      title: m[4],
      description: m[5],
      age_groups: JSON.parse(m[6]),
      order_index: Number(m[7]),
      xp_reward: Number(m[8]),
      difficulty: m[9],
    });
  }
}
console.log('Extracted lessons:', lessons.length);
fs.writeFileSync('c:/www/learn/brightmind/scratch/lessons.json', JSON.stringify(lessons, null, 2));

