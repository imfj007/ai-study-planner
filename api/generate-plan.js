export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { subjectName, daysLeft, hours, totalHours, level, goal, weakTopics } = req.body;

  if (!subjectName || !daysLeft || !hours) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key not configured in Vercel' });
  }

  const prompt = `You are an expert academic coach. 
Create a detailed personalized study plan.

Student Info:
- Subject: ${subjectName}
- Days until exam: ${daysLeft}  
- Daily study time: ${hours} hours/day
- Total available hours: ${totalHours}
- Current level: ${level}
- Goal: ${goal}
- Weak topics: ${weakTopics}

Return ONLY valid JSON. No markdown. 
No backticks. No explanation. 
Exactly this structure:
{
  "overview": {
    "strategy": "2 sentence strategy",
    "keyTip": "single most important tip",
    "technique": "best technique for this subject"
  },
  "phases": [
    {
      "name": "Phase Name",
      "duration": "X days",
      "focus": "main focus",
      "emoji": "📚",
      "tasks": ["task 1","task 2","task 3","task 4"]
    }
  ],
  "weeklySchedule": {
    "Monday": "specific task",
    "Tuesday": "specific task",
    "Wednesday": "specific task",
    "Thursday": "specific task",
    "Friday": "specific task",
    "Saturday": "specific task",
    "Sunday": "light review or rest"
  },
  "milestones": [
    {
      "week": "Week 1",
      "target": "what to achieve",
      "check": "how to verify"
    }
  ],
  "resources": [
    {
      "type": "Book/App/Website/YouTube",
      "name": "Resource name",
      "why": "Why it helps for this subject"
    }
  ],
  "motivationalMessage": "Inspiring 2-sentence message personalized to their goal"
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.error?.message || 'Claude API failed' });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
