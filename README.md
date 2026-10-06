# **Martial Arts Hub**

Create a modern web app (mobile-first) focused on martial arts training, learning, and community. The platform should combine elements of YouTube, TikTok, and a social network, with additional personal tracking features.

🔐 Onboarding & User Profiles

Users must register before accessing the platform. Required fields:

Name

Username (nickname)

Age

Martial arts practiced (multi-select: boxing, BJJ, judo, wrestling, kickboxing, MMA, etc.)

Skill level (beginner, intermediate, advanced)

Content preferences (techniques, fights, analysis, tutorials, motivation, etc.)

User profiles should include:

Profile picture

Bio

Martial arts practiced

Achievements (posts like competition wins, belts earned, etc.)

Followers / following system

🎥 Content Feed (Core Feature)

Create a scrollable feed similar to TikTok/YouTube Shorts:

Vertical video format

Users can upload videos

Like, comment, share

Follow creators

Include a search bar with smart search:
Example searches:

"How to do a kimura from half guard"

"Boxing combinations for beginners"

Content should be categorized and tagged:

Techniques (armbar, kimura, takedown, etc.)

Martial art type

Difficulty level

⚔️ Technique Duels (Unique Feature)

Create a feature where:

Users upload or select two videos

Community votes: "Which technique execution is better?"

Show results with percentages

Add comments for analysis

🧑‍🤝‍🧑 Social Features

Follow/unfollow users

Notifications (likes, comments, new followers)

User posts (images/videos of achievements, competitions, belts, etc.)

Comment system with replies

📅 Personal Training Tracker (PRIVATE)

Each user has a private dashboard (not visible to others):

Training Calendar:

Add training sessions (e.g. 18:00–19:00 Kickboxing)

Mark as completed or not

Rate effort (1–10)

Add notes

Monthly Recap (AUTO-GENERATED):

Total trainings completed

Consistency %

Average effort

Most trained martial art

🎯 Goals System (IMPORTANT)

Users can set personal goals:

Example:

"Train 4 times per week"

"Improve guard passing"

"Lose 3kg"

Track progress visually (progress bars)

🏆 Gamification System

XP points for:

Posting content

Commenting

Training consistency

Levels (Beginner → Pro → Master)

Badges:

"First competition"

"10 trainings in a row"

"First upload"

🎨 UI/UX Design

Clean, modern, dark mode

Mobile-first design (VERY IMPORTANT)

Smooth scrolling experience

Simple navigation:

Home (feed)

Search

Duels

Create (+)

Profile

⚙️ Technical Requirements

Scalable architecture

Modular components

API-ready backend structure

Database structure for:

Users

Videos

Comments

Duels

Training sessions

Goals

🚀 Extra Smart Features (IMPORTANT)

Save videos for later

"Continue watching"

Recommended content based on preferences

Trending techniques section

The app should feel like a mix between:

TikTok (content feed)

YouTube (search & learning)

Reddit (community discussion)

Strava (personal tracking)

Focus on performance, usability, and engagement.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://martial-arts-community.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3bcbb2f5-2426-478d-86b6-829d3268ed26).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
