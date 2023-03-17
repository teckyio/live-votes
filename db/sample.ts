import { proxy } from './proxy'

// This file serve like the knex seed file.
//
// You can setup the database with sample data via the db proxy.

console.log('seeding sample data...')

proxy.poll[1] = { question: 'What is your favorite programming languages?' }

proxy.vote_option[1] = { poll_id: 1, title: 'Typescript', votes: 100 }
proxy.vote_option[2] = { poll_id: 1, title: 'JavaScript', votes: 80 }
proxy.vote_option[3] = { poll_id: 1, title: 'Java', votes: 120 }
proxy.vote_option[4] = { poll_id: 1, title: 'Python', votes: 200 }
proxy.vote_option[5] = { poll_id: 1, title: 'PHP', votes: 50 }

proxy.poll[2] = { question: 'What is your favorite editor?' }
proxy.vote_option[6] = { poll_id: 2, title: 'VSCode', votes: 200 }
proxy.vote_option[7] = { poll_id: 2, title: 'IDEA', votes: 150 }
proxy.vote_option[8] = { poll_id: 2, title: 'vim', votes: 80 }
proxy.vote_option[9] = { poll_id: 2, title: 'emacs', votes: 70 }

console.log('done.')
