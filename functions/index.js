const functions = require("firebase-functions")
const axios = require('axios')
const querystring = require('querystring')
const _ = require('lodash')
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
const adminDb = admin.initializeApp(functions.config().firebase);
const cors = require("cors")
const express = require("express")
const composeTimelineItems = require('./helperFunctions.js').composeTimelineItems;
// import {composeTimelineItems} from './helperFunctions.js'

/* Express instance server */
const app = express()

const CLINICIAN = 'clinician'



var whitelist = ['https://www.weschedule.co', 'https://weschedule.herokuapp.com']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  }
}
/* Middlewares */
// app.use(cors(corsOptions))  // TODO: ACTIVATE THIS once the app goes to production, in the meanwhile allow all origins
app.use(cors({origin:true}))

// ->  Example of how to use caching, use the firebase built-in.
app.get("/cache-posts", (request, response) => {
  return admin.database().ref(`/tasks`).once('value')
    .then(snapshot => {
      console.log('Posts values', snapshot.val());
      console.log('Post values types', typeof(snapshot.val()))
      response.set('Cache-Control', 'public, max-age=300, s-maxage=600');
      return response.send(snapshot.val())
    })
  });

//  TODO : turned off this cloud function, original cloud function, we may no longer needed

// app.post("/ma_task", (request, response) => {
//   let tasks = []
//   let mas = []
//   let payload = {}
//   let tasks_dic = {}
//   let mas_dic = {}
//   return admin.database().ref('/tasks').once('value').then(snapshot => {
//     tasks_dic = snapshot.val();
//     // iterating through every task key
//     for(task_key in tasks_dic ){
//       // fetch data from tasks dic
//       let task_data = tasks_dic[task_key];
//       let task_to_add = {}
//       // add the key to the value
//       task_to_add['key'] = task_key;
//       task_to_add['skills_req'] = task_data['skills_req'];
//       task_to_add['effort'] = task_data['effort'];
//       // parse the dates into ints
//       let due_dates = task_data['due_dates'].split(',')
//       let result_dates = []
//       due_dates.map(el=>{
//         el = parseInt(el)
//         result_dates = [...result_dates, el]
//       })
//       task_to_add['due_dates'] = result_dates;
//       // add data to tasks array
//       tasks = [...tasks, task_to_add]
//     }
//   }).then(()=>{
//     return admin.database().ref('employees').orderByChild('role').equalTo('medical_assistant').once('value').then(snapshot => {
//       mas_dic = snapshot.val()
//       for(ma_key in mas_dic){
//         let ma_data = mas_dic[ma_key]
//
//         let ma_to_add = {}
//         ma_to_add['key'] = ma_key
//         ma_to_add['skills'] = ma_data['skills'].split(',')
//
//         let availability = ma_data['availability'].split(',')
//         let result_availability = []
//         availability.map(el=>{
//           el = parseInt(el)
//           result_availability = [...result_availability, el]
//         })
//         ma_to_add['availability'] = result_availability
//         mas = [...mas, ma_to_add]
//       }
//       payload['ma_info'] = mas;
//       payload['task_info'] = tasks;
//
//     }).then(()=>{
//         return axios.post('https://weschedule-algorithm.herokuapp.com/ma_task', payload)
//         .then(algorithm_response => {
//           let assignments = []
//           let result = algorithm_response['data']
//
//           // Step 1: Iterate through all employees assignments
//           for(employee_id in result){
//             // fetches all the tasks the employee has been paired with
//             let employee_assignments = result[employee_id]
//             // Step 2: fetch every {task_id: '334sk1', due_date: '24'}
//             //   add task name, description, employee_id, employee_key
//             employee_assignments.map(assignment=>{
//               assignment['employee_key'] = employee_id
//               assignment['employee_name'] = mas_dic[employee_id]['name']
//               let task_key = assignment['task_key']
//               assignment['task_name'] = tasks_dic[task_key]['name']
//               assignment['task_description'] = tasks_dic[task_key]['description']
//               assignments = [...assignments, assignment]
//             })
//           }
//           assignments = _.orderBy(assignments, ['due_date'],['asc'])
//           console.log('Assignments', assignments);
//
//           return response.send(assignments);
//         })
//         .catch(function (error) {
//           console.log(error);
//           return response.send(error);
//         })
//       })
//   }).catch(error => {
//       response.send(error)
//     })
//
//   });

  const api = functions.https.onRequest((request, response) => {
    if (!request.path) {
      request.url = `/${request.url}` // prepend '/' to keep query params if any
    }
    console.log("url is: ", request.url);
    return app(request, response)
  })
const example = functions.database.ref('/roomPairs/{id}')
  .onCreate((snapshot, context) => {
    console.log('Here in the example! id', context.params.id );
    console.log('Value', snapshot.val());
  });

  const makeRooming = functions.database.ref('/availability/{year}/{week}/{dayOfYear}/{shiftId}').onCreate((snapshot, context) => {
    console.log('in Make Rooming', context.params.year );
    console.log('Keys makeRoom keys', Object.keys(snapshot));
    console.log('Make roominValue data', snapshot._data);


      // Only edit data when it is first created.
      //
      //   if (change.before.exists()) {
      //     return null;
      //   }
      //     .onWrite((snapshot, context) => {
      //       Grab the current value of what was written to the Realtime Database.

            let shift = snapshot._data;
            let {year} = context.params;
            let {week} = context.params;
            let {dayOfYear} = context.params;
            let {shiftId} = context.params;

            // let year =
            let shiftPath = `/availability/${year}/${week}/${dayOfYear}/${shift.shiftId}/dependencies`
            let itemsPath  =`/rooming/${year}/${week}/${dayOfYear}`
            console.log('Shift Path', shiftPath);
            console.log('itemsPath', itemsPath);

            if(shift.role === CLINICIAN){
                console.log('Clinician case');
                let items = composeTimelineItems(shift);  // not ideal.
                console.log('Composed items', items);
                let itemRef;
                let userId;
                items.map(item => {
                  itemRef = adminDb.database().ref(itemsPath).push()
                  item['id'] = itemRef.key;
                  console.log('Item with id', item);
                  itemRef.set(item);
                  // after saving the timeline item, we store the path to the item under dependencies
                  // of the newly added clinician item, this way if the shift is deleted, we also delete it from
                  // the shift
                  return adminDb.database().ref(shiftPath).push(`${itemsPath}/${itemRef.key}`).then(()=>{
                    console.log('Saving items to dependencie scomplete !!')
                  })
                })
            }
          });
module.exports = {
    api,
    example,
    makeRooming
  }

  // TODO: remove this, or considering adding this cloud funciton
  // exports.makeRooming = functions.database.ref(`/availability/{dayOfYear}/{week}/{dayOfYear}`)
