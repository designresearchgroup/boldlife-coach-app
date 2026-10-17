// The Bold Leadership Academy — the learning content clients work through and
// get certified on. Three levels; each level has modules; each module has
// lessons and a short quiz. Certification at a level requires every module in
// it complete (all lessons done + quiz passed).

export type Role = 'client' | 'coach'

export interface QuizQuestion {
  id: string
  q: string
  options: string[]
  answer: number // index into options
}
export interface Lesson {
  id: string
  title: string
  minutes: number
  body: string[]
  videoUrl?: string
  poster?: string
}
export interface Module {
  id: string
  title: string
  blurb: string
  lessons: Lesson[]
  quiz: QuizQuestion[]
}
export interface Level {
  id: string
  n: number
  name: string
  tagline: string
  paid: boolean
  modules: Module[]
}
export interface Program {
  id: string
  name: string
  subtitle: string
  levels: Level[]
}

export const PASS_MARK = 70
export const ENTITLEMENT_ACADEMY = 'academy'

// On-demand lesson video. In production each lesson carries its own hosted
// videoUrl (and optional poster); until it does, the player falls back to a
// sample so the app is fully functional in demo mode.
// Bundled with the app (src/renderer/public/sample.mp4) so the player works
// offline and in the packaged desktop build — no external dependency.
export const SAMPLE_VIDEO = '/sample.mp4'
export function lessonVideo(l: Lesson): string {
  return l.videoUrl || SAMPLE_VIDEO
}

export const PROGRAM: Program = {
  id: 'bold-academy',
  name: 'The Bold Leadership Academy',
  subtitle: 'From clarity to leading other leaders — the Bold Life method, certified.',
  levels: [
    {
      id: 'l1',
      n: 1,
      name: 'Bold Foundations',
      tagline: 'Clarity and confident decisions — the ground everything else stands on.',
      paid: false,
      modules: [
        {
          id: 'm1',
          title: 'Clarity — Knowing What Truly Matters',
          blurb: 'Cut through the noise and name the few things that actually move your mission.',
          lessons: [
            {
              id: 'm1l1',
              title: 'The Cost of Blurry Priorities',
              minutes: 7,
              body: [
                'When everything is a priority, nothing is. Leaders who try to hold twenty “important” things at once end up reacting to whoever shouted last — and their teams feel the whiplash.',
                'Clarity is not about doing less for its own sake. It is about being able to say, out loud and without flinching, what matters most this quarter and why. That sentence is the single most useful thing a leader owns.',
                'In this module you will build that sentence, and the one-page map that keeps you honest to it.'
              ]
            },
            {
              id: 'm1l2',
              title: 'The One-Page Clarity Map',
              minutes: 9,
              body: [
                'A clarity map has three parts: the outcome that matters most, the two or three bets you are making to reach it, and the things you are deliberately choosing not to do.',
                'The “not doing” list is where the power is. Naming it in writing gives you permission to decline the good-but-distracting, which is most of what crosses a leader’s desk.',
                'Write yours in one page. If it does not fit on one page, it is not yet clear.'
              ]
            }
          ],
          quiz: [
            {
              id: 'm1q1',
              q: 'According to this module, what makes the clarity map powerful?',
              options: [
                'Listing every task you could possibly do',
                'The explicit list of what you are choosing NOT to do',
                'Keeping it private so no one can question it'
              ],
              answer: 1
            },
            {
              id: 'm1q2',
              q: 'A good clarity statement lets a leader…',
              options: [
                'Avoid making any decisions',
                'Say what matters most and why, plainly',
                'Delegate the thinking to their team'
              ],
              answer: 1
            }
          ]
        },
        {
          id: 'm2',
          title: 'Decision — Leading with Confidence',
          blurb: 'A repeatable way to make bold calls without waiting for perfect certainty.',
          lessons: [
            {
              id: 'm2l1',
              title: 'Why Smart Leaders Freeze',
              minutes: 6,
              body: [
                'Capable people often stall on decisions not from lack of ability but from fear of the irreversible. They wait for a certainty that never arrives.',
                'The fix is to sort decisions by reversibility. Most choices are doors you can walk back through — treat them as fast, cheap experiments, not verdicts.'
              ]
            },
            {
              id: 'm2l2',
              title: 'The Bold Decision Framework',
              minutes: 8,
              body: [
                'Name the decision. State the outcome it serves. List the real options (there are almost always more than two). Mark which are reversible. Decide, set a review date, and move.',
                'A decision with a review date is not a gamble — it is a loop. That single habit turns anxious deliberation into confident motion.'
              ]
            }
          ],
          quiz: [
            {
              id: 'm2q1',
              q: 'The framework says most decisions should be treated as…',
              options: [
                'Permanent verdicts to agonize over',
                'Reversible experiments with a review date',
                'Someone else’s responsibility'
              ],
              answer: 1
            },
            {
              id: 'm2q2',
              q: 'What turns anxious deliberation into confident motion?',
              options: [
                'Waiting for complete certainty',
                'Deciding and setting a review date',
                'Making only two options available'
              ],
              answer: 1
            }
          ]
        }
      ]
    },
    {
      id: 'l2',
      n: 2,
      name: 'Bold Practitioner',
      tagline: 'The conversations and resilience that move real people through real change.',
      paid: true,
      modules: [
        {
          id: 'm3',
          title: 'Coaching Conversations',
          blurb: 'Listen past the words and ask the questions that actually move someone.',
          lessons: [
            {
              id: 'm3l1',
              title: 'Listening Past the Words',
              minutes: 8,
              body: [
                'Most “listening” is waiting to talk. Real listening tracks three layers at once: the content, the emotion under it, and what the person is not saying.',
                'When you reflect the layer they did not expect you to hear, the conversation gets honest — fast.'
              ]
            },
            {
              id: 'm3l2',
              title: 'Questions That Move People',
              minutes: 7,
              body: [
                'Advice creates dependence; questions create capability. The best coaching questions are short, open, and slightly uncomfortable: “What would you do if you weren’t afraid?”',
                'Ask, then be quiet. The silence is where the work happens.'
              ]
            }
          ],
          quiz: [
            {
              id: 'm3q1',
              q: 'Real listening tracks content, emotion, and…',
              options: ['your next point', 'what is not being said', 'the time remaining'],
              answer: 1
            },
            {
              id: 'm3q2',
              q: 'Why favor questions over advice?',
              options: [
                'Questions create capability instead of dependence',
                'Advice is always wrong',
                'Questions are faster to say'
              ],
              answer: 0
            }
          ]
        },
        {
          id: 'm4',
          title: 'Navigating Change & Resilience',
          blurb: 'Lead through the messy middle without burning yourself or your team out.',
          lessons: [
            {
              id: 'm4l1',
              title: 'Leading Through the Messy Middle',
              minutes: 9,
              body: [
                'Every change has a middle where the old way is gone and the new way is not working yet. Teams panic here and leaders are tempted to retreat.',
                'Name the middle out loud. “This is the hard part, it is normal, and here is our next small step.” Naming it is half the leadership.'
              ]
            },
            {
              id: 'm4l2',
              title: 'Sustainable Pace, Not Burnout',
              minutes: 7,
              body: [
                'Bold does not mean depleted. Sustainable leaders protect recovery like a calendar commitment, because judgment is the first thing to go when you are running on empty.',
                'Model the pace you want your team to keep. They are watching what you do, not what you say about balance.'
              ]
            }
          ],
          quiz: [
            {
              id: 'm4q1',
              q: 'What is the leader’s job in the “messy middle” of a change?',
              options: [
                'Pretend everything is fine',
                'Name it as normal and give the next small step',
                'Retreat to the old way'
              ],
              answer: 1
            },
            {
              id: 'm4q2',
              q: 'Sustainable leaders protect recovery because…',
              options: [
                'It looks good to others',
                'Judgment degrades when you run on empty',
                'They have nothing else to do'
              ],
              answer: 1
            }
          ]
        }
      ]
    },
    {
      id: 'l3',
      n: 3,
      name: 'Bold Leader',
      tagline: 'Multiply your impact: develop other leaders and influence beyond your title.',
      paid: true,
      modules: [
        {
          id: 'm5',
          title: 'Developing Other Leaders',
          blurb: 'Shift from being the best doer to building people who outgrow you.',
          lessons: [
            {
              id: 'm5l1',
              title: 'From Doer to Multiplier',
              minutes: 8,
              body: [
                'The skills that made you a great individual contributor can trap you as a leader. Your new output is other people’s growth, not your own heroics.',
                'Measure yourself on how often your team succeeds without you in the room.'
              ]
            },
            {
              id: 'm5l2',
              title: 'The Delegation Ladder',
              minutes: 7,
              body: [
                'Delegation is not all-or-nothing. It is a ladder: do it for them, do it with them, watch them do it, hear about it after, stop hearing about it.',
                'Name which rung each task is on, and move it up one rung at a time. That is how you build capability without dropping the ball.'
              ]
            }
          ],
          quiz: [
            {
              id: 'm5q1',
              q: 'A leader’s real output as a multiplier is…',
              options: ['their own heroics', 'other people’s growth', 'the longest hours'],
              answer: 1
            },
            {
              id: 'm5q2',
              q: 'The delegation ladder says you should…',
              options: [
                'Hand everything over at once',
                'Move a task up one rung at a time',
                'Never let go of anything'
              ],
              answer: 1
            }
          ]
        },
        {
          id: 'm6',
          title: 'Strategic Influence',
          blurb: 'Read the room above you and make the bold ask that gets a yes.',
          lessons: [
            {
              id: 'm6l1',
              title: 'Reading the Room Above You',
              minutes: 8,
              body: [
                'Influence upward starts with understanding what the people above you are measured on. Frame your ask in their currency, not yours.',
                'The same request lands completely differently depending on whether you tie it to their risk, their mandate, or their reputation.'
              ]
            },
            {
              id: 'm6l2',
              title: 'Making the Bold Ask',
              minutes: 7,
              body: [
                'Under-asking is the quiet career killer. Name exactly what you want, why it serves the mission, and what you will own in return.',
                'A specific, confident ask is easy to say yes to. A vague, apologetic one is easy to defer forever.'
              ]
            }
          ],
          quiz: [
            {
              id: 'm6q1',
              q: 'To influence upward, frame your ask in…',
              options: ['your own priorities', 'the other person’s currency', 'as much detail as possible'],
              answer: 1
            },
            {
              id: 'm6q2',
              q: 'A bold ask is one that is…',
              options: [
                'Vague and apologetic',
                'Specific and tied to the mission',
                'Never actually made'
              ],
              answer: 1
            }
          ]
        }
      ]
    }
  ]
}

export function allModules(): Module[] {
  return PROGRAM.levels.flatMap((l) => l.modules)
}
export function findLevel(id?: string): Level | undefined {
  return PROGRAM.levels.find((l) => l.id === id)
}
export function findModule(id?: string): Module | undefined {
  return allModules().find((m) => m.id === id)
}
export function findLesson(id?: string): Lesson | undefined {
  return allModules()
    .flatMap((m) => m.lessons)
    .find((l) => l.id === id)
}
