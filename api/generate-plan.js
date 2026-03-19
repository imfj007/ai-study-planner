export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { subjectName, daysLeft, hours, totalHours, level, goal, weakTopics } = req.body;

  if (!subjectName || !daysLeft || !hours) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Switched to GEMINI_API_KEY as requested
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API Key not configured in Vercel. Please add GEMINI_API_KEY to environment variables.' });
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
    // Calling Google Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
           responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.error?.message || 'Gemini API failed' });
    }

    const data = await response.json();
    
    // Parse Gemini's response structure
    const text = data.candidates[0].content.parts[0].text;
    const clean = text.replace(/```json|```/g, "").trim();
    const plan = JSON.parse(clean);

    return res.status(200).json({ content: [{ text: JSON.stringify(plan) }] });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
