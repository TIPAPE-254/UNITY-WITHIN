const adaptSchemaForMysql = (sql) => {
    return sql
        .replace(/INTERVAL\s+'(\d+)\s*(DAY|DAYS|WEEK|WEEKS|MONTH|MONTHS|YEAR|YEARS|HOUR|HOURS|MINUTE|MINUTES|SECOND|SECONDS)'/gi,
            (_, num, unit) => `INTERVAL ${num} ${unit.toUpperCase().replace(/S$/, '')}`);
};

const query1 = "SELECT mood, intensity, note, created_at FROM user_moods WHERE user_id = '9' AND created_at >= NOW() - INTERVAL '14 DAY' ORDER BY created_at DESC";
const query2 = "VALUES (?, ?, ?, 'pending', NOW() + INTERVAL '3 days')";

console.log("Q1:", adaptSchemaForMysql(query1));
console.log("Q2:", adaptSchemaForMysql(query2));
