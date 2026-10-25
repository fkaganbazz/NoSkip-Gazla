import type { explore as tr } from '../tr/explore';

export const explore: typeof tr = {
  screen: {
    title: 'Explore',
    searchPlaceholder: 'Search challenges',
    popular: 'Popular',
    results: 'Results',
    seeAll: 'See all',
    empty: 'No challenges match this search. You can create your own.',
    createOwn: 'Create your own',
  },

  chips: {
    all: 'All',
    categories: {
      detox: 'Detox',
      social_courage: 'Social courage',
      sport: 'Fitness',
      food_drink: 'Food & drink',
      reading: 'Reading',
      money: 'Money',
      quirky: 'Quirky',
    },
  },

  categoryNames: {
    detox: 'Detox',
    social_courage: 'Social courage',
    sport: 'Fitness',
    food_drink: 'Food & drink',
    reading: 'Reading',
    money: 'Money',
    quirky: 'Quirky & fun',
  },

  difficulty: {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
  },

  featured: {
    label: 'CHALLENGE OF THE WEEK',
    doingNow: (n) => (n === 1 ? '1 person is doing it now' : `${n} people are doing it now`),
    open: 'Take a look',
    a11y: (title) => `Challenge of the week: ${title}. Take a look`,
  },

  list: {
    rowA11y: (title, meta, days) => `${title}, ${meta}, ${days === 1 ? '1 day' : `${days} days`}`,
    createOwn: 'Create your own',
  },

  adTag: 'AD',

  preview: {
    notFound: "We couldn't find this challenge.",
    goBack: 'Go back',
    difficulty: (level) => `${level} difficulty`,
    duration: 'Duration',
    withFriends: 'With friends',
    startSolo: 'Start solo',
    features: {
      taskType: {
        check: 'Check in with a single tap every day',
        number: 'Log your number every day: minutes, steps, pages',
        photo: 'Prove it with a photo every day for the group to see',
      },
      rescue: 'Miss a day and Diken wilts, but you can still rescue it',
      garden: 'On the last day, a new cactus joins your garden',
    },
    doingNow: {
      others: (n) => (n === 1 ? '1 person is doing it now' : `${n} people are doing it now`),
      one: (name) => `${name} is doing it now`,
      two: (first, second) => `${first} and ${second} are doing it now`,
      namesAndOthers: (names, n) => `${names} and ${n === 1 ? '1 other' : `${n} others`} are doing it now`,
    },
  },
};
