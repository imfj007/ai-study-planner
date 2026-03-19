export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { subjectName, daysLeft, hours, totalHours, level, goal, weakTopics } = req.body;

  if (!subjectName || !daysLeft || !hours) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set in Vercel' });
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

Return ONLY valid JSON. Exactly this structure:
{
  "overview": {
    "strategy": "2 sentence strategy",
    "keyTip": "single most important tip"
  },
  "phases": [
    {
      "name": "Phase Name",
      "duration": "X days",
      "focus": "main focus",
      "emoji": "📚",
      "tasks": ["task 1","task 2","task 3"]
    }
  ],
  "weeklySchedule": {
    "Monday": "task", "Tuesday": "task", "Wednesday": "task", 
    "Thursday": "task", "Friday": "task", "Saturday": "task", "Sunday": "task"
  },
  "milestones": [{ "week": "Week 1", "target": "achieve X" }],
  "resources": [{ "type": "Web", "name": "Google", "why": "Search" }],
  "motivationalMessage": "You can do it!"
}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.error?.message || 'Gemini Failed' });
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const plan = JSON.parse(text.replace(/```json|```/g, "").trim());

    // Simplified direct JSON response
    return res.status(200).json(plan);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
