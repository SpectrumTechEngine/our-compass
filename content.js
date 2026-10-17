/* Our Compass: ready-made words, scenarios and cards.
   Wording rules: kind and neutral. "Tricky moments", never "bad behaviour". Understanding others, not acting "normal". */
window.OC_CONTENT = (function () {
  'use strict';

  const AGES = {
    little: { label: 'Little', sub: '4 to 7' },
    middle: { label: 'Middle', sub: '8 to 12' },
    teen:   { label: 'Teen',   sub: '13+' }
  };

  const THEMES = {
    animals: { label: 'Animals', emoji: '🐾', deco: ['🐶', '🐱', '🦊', '🐢', '🦉'] },
    space:   { label: 'Space',   emoji: '🚀', deco: ['🪐', '⭐', '🌙', '🛰️', '☄️'] },
    nature:  { label: 'Nature',  emoji: '🌿', deco: ['🌳', '🌼', '🍄', '🌊', '🦋'] },
    plain:   { label: 'Plain',   emoji: '◻️', deco: [] }
  };

  const EMOJIS = ['🦊', '🐼', '🐯', '🦁', '🐸', '🐙', '🦄', '🐢', '🦉', '🐬', '🚀', '🌟', '🌈', '⚽', '🎨', '🎮', '🎸', '🦖', '🌻', '🏎️'];

  // "What's hardest right now?" Each one lifts some tools and some scenario tags to the top.
  const HARD = [
    ['change',      'Changes of plan',                  ['firstthen', 'stories', 'today'], ['change']],
    ['transitions', 'Stopping one thing to start another', ['timer', 'firstthen'],      ['change']],
    ['losing',      'Losing a game',                    ['scenarios'],                  ['losing']],
    ['friends',     'Friendships',                      ['scenarios', 'rules', 'battery'], ['friends']],
    ['big',         'Big feelings and meltdowns',       ['checkin', 'calm', 'cards'],   ['feelings']],
    ['interrupting','Interrupting or waiting a turn',   ['scenarios', 'rules'],         ['turns']],
    ['sharing',     'Sharing',                          ['scenarios'],                  ['sharing']],
    ['sensory',     'Noise, crowds and busy places',    ['cards', 'battery', 'calm'],   ['sensory']],
    ['school',      'School',                           ['battery', 'cards', 'today'],  ['school']],
    ['worry',       'Worry',                            ['checkin', 'stories', 'notes'], ['worry']],
    ['others',      'Knowing how others feel',          ['scenarios', 'rules'],         ['feelings', 'friends']],
    ['routines',    'Morning and bedtime routines',     ['today', 'timer'],             ['change']],
    ['sleep',       'Sleep',                            ['checkin', 'calm'],            []]
  ];

  // Child tools. "on" = which age groups have it switched on to start with.
  const TOOLS = [
    { id: 'checkin',   emoji: '🎨', name: 'How am I?',          teen: 'Check-in',          desc: 'Pick a colour for how you feel', on: ['little', 'middle', 'teen'] },
    { id: 'calm',      emoji: '🫧', name: 'Calm corner',        teen: 'Breathe',           desc: 'Slow breathing to feel calmer', on: ['little', 'middle', 'teen'] },
    { id: 'cards',     emoji: '🪧', name: 'Show a card',        teen: 'Quick cards',       desc: 'Show a card when words are hard', on: ['little', 'middle', 'teen'] },
    { id: 'reward',    emoji: '⭐', name: 'Star chart',         teen: 'Goals',             desc: 'Stars towards a treat', on: ['little', 'middle', 'teen'] },
    { id: 'firstthen', emoji: '➡️', name: 'First / then',       teen: 'First / then',      desc: 'What happens first, then next', on: ['little', 'middle'] },
    { id: 'timer',     emoji: '⏳', name: 'Timer',              teen: 'Timer',             desc: 'See how long until the next thing', on: ['little', 'middle', 'teen'] },
    { id: 'today',     emoji: '✅', name: 'Today list',         teen: 'Today',             desc: 'Tick off the steps of a routine', on: ['little', 'middle'] },
    { id: 'stories',   emoji: '📖', name: 'Coming up',          teen: 'Coming up',         desc: 'Get ready for something new', on: ['little', 'middle', 'teen'] },
    { id: 'scenarios', emoji: '💭', name: 'What would you do?', teen: 'What would you do?', desc: 'Everyday moments, and how others feel', on: ['little', 'middle', 'teen'] },
    { id: 'rules',     emoji: '🔎', name: 'Hidden rules',       teen: 'Unwritten rules',   desc: 'Things people expect but don\'t say', on: ['middle', 'teen'] },
    { id: 'battery',   emoji: '🔋', name: 'Social battery',     teen: 'Social battery',    desc: 'How much people-energy is left', on: ['middle', 'teen'] },
    { id: 'wins',      emoji: '🏆', name: 'My wins',            teen: 'My wins',           desc: 'Good moments to remember', on: ['little', 'middle', 'teen'] },
    { id: 'notes',     emoji: '📓', name: 'My notes',           teen: 'My notes',          desc: 'Private notes, just for you', on: ['middle', 'teen'] }
  ];

  // Colour check-in. No trademarked names: just colours and plain words.
  const COLOURS = [
    { id: 'blue',   hex: '#4a7fc1', soft: '#e3edf9', name: 'Blue',   little: 'Sad or tired',  word: 'Low',      sub: 'tired, sad, slow, bored' },
    { id: 'green',  hex: '#3f9a63', soft: '#e2f3e8', name: 'Green',  little: 'Happy and calm', word: 'Good',    sub: 'calm, okay, ready, happy' },
    { id: 'yellow', hex: '#d6a21e', soft: '#fbf1d6', name: 'Yellow', little: 'Wobbly',        word: 'Wobbly',   sub: 'worried, fidgety, silly, frustrated, very excited' },
    { id: 'red',    hex: '#c9503f', soft: '#f8e1dc', name: 'Red',    little: 'Too much',      word: 'Too much', sub: 'everything is too much, angry, scared, out of control' }
  ];
  const CALM_IDEAS = {
    blue:   ['Have a snack or a drink', 'Wrap up in a blanket', 'Listen to a favourite song', 'Ask for a hug', 'Rest for a while'],
    green:  ['Do something I enjoy', 'Help someone', 'Notice what is making today good'],
    yellow: ['Take 5 slow breaths', 'Squeeze a cushion', 'Go for a short walk', 'Ask for a break', 'Put on my headphones'],
    red:    ['Go to my calm space', 'Breathe with the calm corner', 'Push hard against a wall', 'No talking for a while, that\'s OK', 'Ask a grown-up to stay close']
  };
  const BODY_CLUES = ['Fast heartbeat', 'Hot face', 'Tight tummy', 'Clenched hands', 'Heavy body', 'Want to hide', 'Can\'t sit still', 'Tears', 'Loud voice', 'Head buzzing'];

  const BATTERY = [
    { v: 4, emoji: '🔋', label: 'Full',  tip: 'Lots of energy for people today.' },
    { v: 3, emoji: '🔋', label: 'Good',  tip: 'Plenty left. Still nice to have a break later.' },
    { v: 2, emoji: '🪫', label: 'Half',  tip: 'Maybe plan a quiet time soon.' },
    { v: 1, emoji: '🪫', label: 'Low',   tip: 'Time to recharge: somewhere quiet, a favourite thing, less talking.' },
    { v: 0, emoji: '🪫', label: 'Empty', tip: 'It\'s fine to stop. Quiet, alone time and no questions for a while.' }
  ];
  const RECHARGE = ['Quiet time alone', 'Favourite interest', 'Headphones or music', 'Time outside', 'Screen time', 'Being with a pet', 'Less talking'];

  const CARDS = [
    { e: '✋', t: 'I need a break', bg: '#4a7fc1' },
    { e: '🔇', t: 'It\'s too loud', bg: '#7a5bb5' },
    { e: '🙋', t: 'I need help', bg: '#3f9a63' },
    { e: '⏸️', t: 'I\'m OK. I just need a minute', bg: '#5d6d74' },
    { e: '🤐', t: 'I can\'t talk right now', bg: '#c9503f' },
    { e: '🚻', t: 'I need the toilet', bg: '#d08a2a' },
    { e: '💧', t: 'I need a drink or a snack', bg: '#2f8a8a' },
    { e: '❓', t: 'I don\'t understand. Please show me', bg: '#9a6a12' }
  ];

  const FT_PRESETS = [['🦷', 'Brush teeth'], ['👕', 'Get dressed'], ['🎒', 'School bag'], ['🚗', 'Car'], ['🍽️', 'Dinner'], ['🛁', 'Bath'],
    ['📚', 'Homework'], ['🎮', 'Games'], ['📺', 'TV'], ['🛝', 'Playground'], ['🛏️', 'Bed'], ['🧸', 'Play'], ['🛒', 'Shops'],
    ['🚶', 'Walk'], ['🎨', 'Drawing'], ['🍪', 'Snack'], ['🧹', 'Tidy up'], ['🏫', 'School']];
  const TIMER_FOR = ['we leave', 'tidy up time', 'dinner', 'bedtime', 'the game stops', 'screen time ends'];

  const TODAY_PRESETS = {
    'Morning': [['🚽', 'Toilet'], ['🧼', 'Wash face'], ['👕', 'Get dressed'], ['🥣', 'Breakfast'], ['🦷', 'Brush teeth'], ['🎒', 'School bag'], ['👟', 'Shoes and coat']],
    'Bedtime': [['🛁', 'Bath or shower'], ['🩳', 'Pyjamas'], ['🦷', 'Brush teeth'], ['📖', 'Story or reading'], ['💡', 'Lights low'], ['🛏️', 'Into bed']],
    'After school': [['🎒', 'Bag away'], ['🍪', 'Snack'], ['🛋️', 'Quiet time'], ['📚', 'Homework'], ['🎮', 'Free time']]
  };

  // Diary ticks
  const TICKS = [
    ['sleep',  '😴', 'Bad night\'s sleep', 'day'],
    ['hungry', '🍞', 'Hungry', 'moment'],
    ['bigday', '📅', 'Big day (trip, visitors, change of plan)', 'day'],
    ['unwell', '🤒', 'Unwell', 'day'],
    ['school', '🏫', 'School day', 'day']
  ];
  const BEFORE = ['Change of plan', 'Stopping something they liked', 'Waiting', 'Noisy or busy place', 'Asked to do something', 'Screen time ended',
    'Lost a game', 'Something with friends', 'New place or person', 'Tired', 'Too hot or cold', 'Clothes or textures'];
  const HELPED = ['Quiet space', 'Time alone', 'Hug or deep pressure', 'Fewer words', 'Movement', 'Snack or drink', 'Headphones', 'Favourite thing',
    'Screen time', 'Breathing', 'Time and patience'];
  const GOOD = ['Coped with a change', 'Tried something new', 'Played with others', 'Calmed down by themselves', 'Asked for help', 'Said how they felt',
    'Waited for a turn', 'Was kind to someone', 'Had a good day at school', 'Slept well'];
  const SIZES = [['small', 'Small'], ['medium', 'Medium'], ['big', 'Big']];

  const PLAN_STEPS = [
    'Stay calm and close by. Keep your voice low and slow.',
    'Use very few words. No questions or choices yet.',
    'Make it quieter: less noise, less light, fewer people.',
    'Offer the calm space or comfort item. Don\'t force it.',
    'Keep everyone safe, and give space if they want space.',
    'Wait. It will pass. Your calm helps theirs.',
    'Afterwards: rest, a drink, no telling off. Talk about it later, only if they want to.'
  ];

  const SENSES = [['noise', '👂', 'Noise'], ['light', '💡', 'Light'], ['touch', '✋', 'Touch'], ['smells', '👃', 'Smells'], ['clothes', '👕', 'Clothes and labels'], ['tastes', '👅', 'Food tastes and textures']];
  const SENSE_LEVELS = [['', 'Not sure'], ['very', 'Very sensitive'], ['bit', 'A bit sensitive'], ['ok', 'No problem'], ['seeks', 'Loves lots of it']];

  /* Scenarios: no "wrong" answers. Each choice explains how others might feel. good: true marks choices that often go well. */
  const S = (id, ages, tags, title, text, options, tip) => ({ id, ages, tags, title, text, options, tip });
  const O = (t, how, good) => ({ t, how, good: !!good });
  const SCENARIOS = [
    S('lose-board', ['little', 'middle'], ['losing'], 'Losing a board game', 'You are playing a board game with your cousin. They win.',
      [O('Say "Good game!"', 'Your cousin feels happy and wants to play again. It\'s OK to still feel disappointed inside.', true),
       O('Knock the board over', 'Your cousin might feel sad or cross, and may not want to play next time. Losing feels horrible. That feeling is real.'),
       O('Say "Can we play again?"', 'Lots of people like a rematch! Your cousin will probably say yes.', true)],
      'Losing feels bad for everyone. It\'s fine to need a minute before saying anything.'),
    S('change-park', ['little', 'middle'], ['change'], 'The plan changed', 'You were going to the park, but it is raining so you are staying in.',
      [O('Feel cross and say "That\'s not fair!"', 'Your grown-up understands. Changes are hard. They might feel sad that you are upset too.'),
       O('Ask "When can we go instead?"', 'Your grown-up feels glad you asked. Knowing the new plan can make it easier.', true),
       O('Pick something else to do inside', 'This can turn the day around. Your family might enjoy it too.', true)],
      'It\'s OK to feel upset about a change. Asking "what happens now?" can help.'),
    S('wait-turn-slide', ['little'], ['turns'], 'Waiting for the slide', 'There is a line of children waiting for the slide.',
      [O('Go to the back of the line', 'The other children feel it is fair. Your turn will come.', true),
       O('Go straight to the front', 'The other children have been waiting, so they might feel cross or say "Hey!"'),
       O('Play on something else and come back', 'Good idea if waiting is hard. Nobody minds.', true)]),
    S('share-toy', ['little'], ['sharing'], 'A friend wants your toy', 'You are playing with your favourite toy. A friend asks for a go.',
      [O('Say "You can have it after me"', 'Your friend knows they will get a turn, so they feel OK about waiting.', true),
       O('Hold it tight and turn away', 'Your friend might feel sad. It\'s OK to have special toys you don\'t share. You could put those away before friends come.'),
       O('Find another toy for them', 'Kind idea! Your friend can play too.', true)],
      'Some things are too special to share, and that\'s OK. Putting them away before visitors comes helps.'),
    S('interrupt-talk', ['little', 'middle'], ['turns'], 'Something important to say', 'Your grown-up is talking to another adult. You really want to tell them something.',
      [O('Put a hand on their arm and wait', 'Many grown-ups like this. They know you are waiting and will turn to you soon.', true),
       O('Say it loudly straight away', 'The adults might feel surprised, because they hadn\'t finished. If it\'s urgent (someone hurt), saying it straight away is right.'),
       O('Hold the idea in your head, or draw it', 'Then you won\'t forget it while you wait.', true)],
      'Waiting is hard when your brain is full of the idea. A sign like a hand on the arm can help.'),
    S('noisy-party', ['little', 'middle'], ['sensory'], 'A noisy party', 'You are at a birthday party. It is very loud and your ears hurt.',
      [O('Tell a grown-up "It\'s too loud"', 'Your grown-up can help you find a quieter spot. They\'re glad you told them.', true),
       O('Go somewhere quieter for a while', 'Good choice. You can come back when you feel ready.', true),
       O('Cover your ears and hide', 'This makes sense, it\'s too loud! Telling someone too means they can help.')],
      'Your senses are real. Taking a break isn\'t rude.'),
    S('friend-sad', ['little', 'middle'], ['feelings', 'friends'], 'A friend is crying', 'Your friend is crying at break time.',
      [O('Ask "Are you OK?"', 'Your friend feels someone noticed them. That helps.', true),
       O('Keep playing your game', 'Your friend might feel nobody cares. You may just not know what to do, that\'s OK. You could tell a teacher.'),
       O('Sit near them quietly', 'Some people like company without talking. That can be very kind.', true)]),
    S('new-food', ['little'], ['change', 'sensory'], 'A new food on the plate', 'There is a new food on your plate that you don\'t know.',
      [O('Say "No thank you"', 'Polite and clear. The cook usually feels fine.', true),
       O('Push the plate away and shout', 'The cook might feel hurt, because they made it for you.'),
       O('Look at it, or smell it first', 'Lots of people like to check new food first. That is OK.', true)]),
    S('game-rules', ['middle'], ['friends', 'losing'], 'Friends change the rules', 'You are playing a game at break. Your friends change the rules halfway through.',
      [O('Say "I liked the old rules. Can we decide together?"', 'Friends feel included in deciding. You\'ve said how you feel.', true),
       O('Walk off without saying anything', 'Your friends may think you\'re cross with them, and not know why.'),
       O('Go along with it this time', 'This can keep the game going. It\'s also fine to say you find changes tricky.', true)],
      'Lots of people change rules in games without thinking. Telling them it bothers you is OK.'),
    S('info-dump', ['middle', 'teen'], ['friends', 'turns'], 'Talking about your favourite thing', 'You are telling a friend all about your favourite topic. They start looking around the room.',
      [O('Ask "Do you want to hear more, or shall we talk about something else?"', 'Your friend feels you care what they think too. They might say "Keep going!"', true),
       O('Keep going until you\'ve finished', 'Your friend might feel a bit lost. It doesn\'t mean they don\'t like you.'),
       O('Ask them about their favourite thing', 'People often love being asked. Then it\'s a back-and-forth chat.', true)],
      'Your interests are great. Checking in now and then helps others join in.'),
    S('group-project', ['middle', 'teen'], ['school', 'friends'], 'Group work', 'Your teacher puts you in a group. One person wants to do it a way you think is wrong.',
      [O('Explain your idea, then listen to theirs', 'They feel listened to, so they\'re more likely to listen to you.', true),
       O('Do your part your own way', 'The others might feel left out, and the parts may not fit together.'),
       O('Ask the teacher to help decide', 'Fair, if the group is stuck.', true)]),
    S('sub-teacher', ['middle'], ['school', 'change'], 'A different teacher', 'Your usual teacher is off. There is a teacher you don\'t know today.',
      [O('Tell them something that helps you, like "I need to sit at the front"', 'The new teacher is usually glad to know. It helps them help you.', true),
       O('Refuse to do any work', 'The teacher might think you are being rude, when really you feel unsettled.'),
       O('Use your break card', 'If it is all too much, asking for a break is a good idea.', true)],
      'New people don\'t know what helps you. Telling them, or showing your "All about me" passport, can make it easier.'),
    S('joke', ['middle', 'teen'], ['friends', 'feelings'], 'Is it a joke?', 'Someone says "Nice shoes" and laughs. You\'re not sure if they mean it.',
      [O('Ask "Do you mean that?"', 'A real friend will tell you. It\'s OK to check.', true),
       O('Say "Thanks!"', 'If they meant it, they feel good. If they didn\'t, it shows the comment didn\'t bother you.', true),
       O('Get really cross', 'If they meant it nicely, they will feel confused or upset.')],
      'Tone of voice and faces carry a lot of meaning. Checking what someone means is fine.'),
    S('lose-match', ['middle', 'teen'], ['losing'], 'Losing online', 'You lose a match in an online game, and your teammate says "unlucky".',
      [O('Say "Unlucky" or "GG" back', 'Your teammate feels it\'s a friendly team. They\'ll want to play with you again.', true),
       O('Blame your teammate', 'They will probably feel annoyed or hurt. Losing is frustrating for them too.'),
       O('Take a break before the next game', 'Smart. It helps the next game feel fresh.', true)]),
    S('plans-cancelled', ['middle', 'teen'], ['change', 'friends'], 'A friend cancels', 'Your friend cancels your plans to meet up, an hour before.',
      [O('Say "That\'s a shame. Can we pick another day?"', 'Your friend feels you still want to see them. You\'ve made a new plan.', true),
       O('Message them lots of times asking why', 'Your friend might feel under pressure. They may have a reason they don\'t want to share.'),
       O('Tell them it\'s fine, then feel upset on your own', 'It\'s OK to be disappointed. You could tell someone at home how you feel.')],
      'Cancelled plans feel horrible when you were ready. Having a back-up plan can help.'),
    S('group-chat', ['teen'], ['friends'], 'The group chat', 'Your friends are chatting in a group chat about a party you weren\'t invited to.',
      [O('Message one friend privately: "Was I meant to come?"', 'Most friends would rather you asked than worried. It might be a mistake.', true),
       O('Post something angry in the group', 'The whole group sees it, so people might feel embarrassed or defensive.'),
       O('Mute the chat for a while', 'Fine to protect yourself. You can talk about it when you feel ready.', true)]),
    S('eye-contact', ['teen'], ['friends', 'feelings'], 'Not looking at someone', 'You listen better when you don\'t look at people\'s eyes. Someone says "Look at me when I\'m talking".',
      [O('Say "I listen better when I look away"', 'Most people are fine once they know. You don\'t have to force eye contact.', true),
       O('Stare at their eyes even though it feels awful', 'You might lose track of what they\'re saying. You don\'t need to do this.'),
       O('Look near their face, like their nose or shoulder', 'Some people find this comfortable. It\'s your choice.', true)],
      'You don\'t need to act like someone you aren\'t. Telling people what works for you is fair.'),
    S('teacher-tone', ['teen', 'middle'], ['school', 'feelings'], 'A sharp voice', 'A teacher says "Is that what you call finished?" in a sharp voice.',
      [O('Answer "Yes"', 'You were answering the question. But the teacher probably meant "This needs more work". They may feel you\'re being cheeky.'),
       O('Ask "Do you want me to add more?"', 'The teacher feels understood, and you know what to do next.', true),
       O('Say nothing', 'The teacher may not know if you understood. That\'s OK. You can ask afterwards.')],
      'Some questions aren\'t really questions. "Is that what you call finished?" usually means "Please do more".'),
    S('too-much-shop', ['little', 'middle', 'teen'], ['sensory', 'feelings'], 'Overwhelmed in a shop', 'You are in a busy shop. The lights, noise and people are getting too much.',
      [O('Tell your grown-up, or show your break card', 'They can help you leave or find somewhere calmer. They\'re glad you told them.', true),
       O('Put on headphones or sunglasses', 'Great way to make it easier.', true),
       O('Keep going until you explode', 'Afterwards you might feel awful, and people around might feel worried. It\'s OK to ask to stop early.')]),
    S('compliment', ['middle', 'teen'], ['friends'], 'Saying something kind', 'Your friend shows you a drawing they\'re proud of. You don\'t really like it.',
      [O('Find something you do like: "I like the colours"', 'Your friend feels proud and happy. And you\'re still being honest.', true),
       O('Say "I don\'t like it"', 'Honest, but your friend might feel hurt, because they were proud of it.'),
       O('Ask "How did you make it?"', 'Your friend loves telling you. They feel you\'re interested.', true)],
      'Honesty is a great thing. You can be honest AND kind by picking which true thing to say.'),
    S('new-kid', ['middle'], ['friends', 'school'], 'Someone new at school', 'There\'s a new person in your class sitting on their own.',
      [O('Say hello and tell them your name', 'They feel welcome. You might find a new friend.', true),
       O('Leave them alone', 'Fine if you\'re not up to it today. They might like being asked tomorrow.'),
       O('Show them where things are', 'Really helpful. New places are confusing.', true)]),
    S('teen-text-silence', ['teen'], ['friends', 'worry'], 'No reply', 'You messaged a friend hours ago and they haven\'t replied, but you can see they\'re online.',
      [O('Wait, they might be busy', 'Usually there is a boring reason. Your friend will reply when they can.', true),
       O('Send lots of messages', 'Your friend might feel pressured, even if they meant to reply.'),
       O('Do something else for a while', 'Good for your worry. Checking again and again makes it bigger.', true)],
      'Waiting for replies can make worry grow. Most of the time, it\'s nothing to do with you.'),
    S('mistake-help', ['little', 'middle'], ['feelings', 'school'], 'Making a mistake', 'You make a mistake on your work and the page is messy now.',
      [O('Say "Oops", cross it out and keep going', 'Everyone makes mistakes. Your teacher is happy you kept going.', true),
       O('Rip up the page', 'You might feel better for a moment, but then you\'ll have to start again.'),
       O('Ask for a new sheet', 'Fine to ask. Most teachers will help.', true)]),
    S('sibling-room', ['little', 'middle', 'teen'], ['sharing', 'sensory'], 'Someone in your space', 'Your brother or sister comes into your room while you\'re doing something.',
      [O('Say "I need my space right now, can you come back later?"', 'They know what you need, and that they can come back.', true),
       O('Shout "GET OUT!"', 'They might feel hurt or shout back. You do have a right to some space, though.'),
       O('Put a sign on the door for quiet time', 'Brilliant. Everyone knows without you having to say it.', true)])
  ];

  const R = (ages, tags, title, text) => ({ ages, tags, title, text });
  const RULES = [
    R(['little', 'middle'], ['turns'], 'Taking turns to talk', 'People usually wait until someone finishes before they talk. A little pause means it\'s your turn.'),
    R(['little', 'middle', 'teen'], ['friends'], 'Asking to join in', 'Asking "Can I play?" usually goes better than just joining in. If they say no, try someone else or later.'),
    R(['little', 'middle'], ['sharing'], 'Borrowing', 'Ask before you borrow something, and give it back. That helps people trust you.'),
    R(['middle', 'teen'], ['feelings'], '"I\'m fine" might not mean fine', 'Sometimes people say "I\'m fine" when they\'re not. If their face looks sad, you could ask "Are you sure?"'),
    R(['middle', 'teen'], ['friends'], 'Small talk', 'People often say "How are you?" just to be friendly. "Good thanks, you?" is enough. They don\'t usually want the full story.'),
    R(['middle', 'teen'], ['friends', 'feelings'], 'Sarcasm', 'Sometimes people say the opposite of what they mean, like "Oh great" when something bad happens. Their voice often sounds flat or extra-big.'),
    R(['middle', 'teen'], ['school'], 'Questions that are instructions', '"Would you like to sit down?" from a teacher usually means "Please sit down."'),
    R(['middle', 'teen'], ['friends'], 'Honest but kind', 'People often leave out a true thing if it might hurt someone, like a haircut they don\'t like. That isn\'t lying. It\'s choosing what to say.'),
    R(['little', 'middle', 'teen'], ['sensory'], 'Personal space', 'Most people like about an arm\'s length of space when chatting. Hugs are for people who say yes to them.'),
    R(['teen'], ['friends'], 'Group chats', 'People don\'t expect an answer to every message in a group chat. Replying to some is enough.'),
    R(['teen', 'middle'], ['friends', 'turns'], 'Long topics', 'Talking about a favourite topic is great. Every now and then, ask the other person a question so they can join in.'),
    R(['middle', 'teen'], ['school', 'change'], '"In a minute"', '"In a minute" rarely means exactly one minute. It can mean "soon" or "when I\'ve finished". It\'s OK to ask "How long?"'),
    R(['little', 'middle'], ['losing'], 'After a game', 'People often say "Good game" at the end, whoever won. It means "Thanks for playing".'),
    R(['teen'], ['friends'], 'Inside jokes', 'Friends sometimes share jokes from things that happened before. It\'s fine to ask "What\'s the joke?"'),
    R(['middle', 'teen'], ['feelings'], 'Faces and feelings', 'People\'s faces show feelings, but they\'re hard to read. Asking "Are you annoyed with me?" is a good way to find out.'),
    R(['little', 'middle', 'teen'], ['change'], 'Plans can change', 'Grown-ups sometimes change plans without warning. Asking "What happens now?" helps you get your bearings.'),
    R(['middle', 'teen'], ['friends'], 'Saying no', 'You can say no to things you don\'t want to do. "No thanks" is a full answer.'),
    R(['teen'], ['school', 'friends'], 'You don\'t have to mask', 'Some people hide their differences to fit in, and it is exhausting. You don\'t have to. Knowing the hidden rules is just useful information. You choose what to do with it.')
  ];

  return { AGES, THEMES, EMOJIS, HARD, TOOLS, COLOURS, CALM_IDEAS, BODY_CLUES, BATTERY, RECHARGE, CARDS, FT_PRESETS, TIMER_FOR, TODAY_PRESETS,
    TICKS, BEFORE, HELPED, GOOD, SIZES, PLAN_STEPS, SENSES, SENSE_LEVELS, SCENARIOS, RULES };
})();
