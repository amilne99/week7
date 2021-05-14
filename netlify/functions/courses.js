// Goal: Kellogg course reviews API!
//
// Business logic:
// - Courses can be taught by more than one lecturer (e.g. Brian Eng's KIEI-451 and Ben Block's KIEI-451)
// - Information on a course includes the course number (KIEI-451) and name (Intro to Software Development)
// - Lecturers can teach more than one course (e.g. Brian Eng teaches KIEI-451 and KIEI-925)
// - Reviews can be written (anonymously) about the lecturer/course combination (what would that be called?)
// - Reviews contain a String body, and a numeric rating from 1-5
// - Keep it simple and ignore things like multiple course offerings and quarters; assume reviews are written
//   about the lecturer/course combination only – also ignore the concept of a "user" and assume reviews
//   are written anonymously
//
// Tasks:
// - (Lab) Think about and write the domain model - fill in the blanks below
// - (Lab) Build the domain model and some sample data using Firebase
// - (Lab) Write an API endpoint, using this lambda function, that accepts a course number and returns 
//   information on the course and who teaches it
// - (Homework) Provide reviews of the lecturer/course combinations 
// - (Homework) As part of the returned API, provide the total number of reviews and the average rating for 
//   BOTH the lecturer/course combination and the course as a whole.

// === Domain model - fill in the blanks ===
// There are 4 models: lecturers, courses, reviews, and experience
// There is one many-to-many relationship: courses <-> lecturers, which translates to two one-to-many relationships:
// - One-to-many: lecturer -> sections
// - One-to-many: courses -> section
// And one more one-to-many: section -> reviews
// Therefore:
// - The first model, courses, contains the following fields (not including ID): course number, course name 
// - The second model, lecturer, contains the following fields: lecturer name
// - The third model, section, contains the following fields: course ID, lecturer ID
// - The fourth model, reviews, contains the following fields: comments, rating, section ID


// allows us to use firebase
let firebase = require(`./firebase`)

// /.netlify/functions/courses?courseNumber=KIEI-451
exports.handler = async function(event) {

  // get the course number being requested
  let courseNumber = event.queryStringParameters.courseNumber

  // establish a connection to firebase in memory
  let db = firebase.firestore()

  // ask Firebase for the course that corresponds to the course number, wait for the response
  let coursesQuery = await db.collection(`courses`).where(`courseNum`,`==`,courseNumber).get()

  // get the first document from the query
  let courses = coursesQuery.docs
  
  // get the id from the document
  let courseId = courses[0].id

  // get the data from the document
  let courseData = courses[0].data()
  
  // set a new Array as part of the return value
  returnValue = {
    courseNumber: courseData.courseNum,
    courseName: courseData.courseName,
    avgClassRating: 0,
    totalNumOfReviews: 0,
    lecturers: []
  }

  // ask Firebase for the sections corresponding to the Document ID of the course, wait for the response
  let sectionsQuery = await db.collection(`sections`).where(`courseId`,`==`,courseId).get()

  // get the documents from the query
  let sections = sectionsQuery.docs
  console.log(sections.length)

  // Start counters for average class rating
  sumClassRating = 0
  sumClassReviews = 0

  // Loop through all the sections
  for (sectionIndex = 0; sectionIndex < sections.length;sectionIndex++) {
  // get the document ID of the section
    sectionId = sections[sectionIndex].id
    
    // get the data from the section
    sectionData = sections[sectionIndex].data()
    
    // ask Firebase for the lecturer with the ID provided by the section; hint: read "Retrieve One Document (when you know the Document ID)" in the reference
    let lecturerQuery = await db.collection(`lecturers`).doc(sectionData.lectId).get() // pull the lecturer name using the lecturer ID in the section which we've already pulled
        
    // get the data from the returned document
    let lectData = lecturerQuery.data()
    
    // Set up a blank array to fill with section specific info and add lecturers name to it
   
    let sectionObject = {
    lecturer: lectData.lectName,
    avgLectRating: 0,
    sectionNumOfReviews: 0,
    reviews: []
      }

    // 🔥 your code for the reviews/ratings goes here
    // Now begin process of populating sectionObject with all relevant reviews

    // get the reviews for this lecturer/section, wait for it to return, store in memory
    let reviewsQuery = await db.collection(`reviews`).where(`sectionId`,`==`,sectionId).get()
    
    // get the documents from the query
    let reviews = reviewsQuery.docs
    
    // Set up counters for average lecturer/class rating
 
  sumSectionRating = 0
  sumSectionReviews = 0

    // loop through the review documents
    for(let reviewIndex=0; reviewIndex < reviews.length;reviewIndex++) {
      // get the id from the review document
      let reviewId = reviews[reviewIndex].id
    
      // get the data from the review document
      let reviewData = reviews[reviewIndex].data()

      // create an Object to be added to the reviews Array of the post
      let reviewObject = {
        rating: reviewData.rating,
        body: reviewData.body
      }
      
      //Add to the total scores in reviews
      sumSectionRating = sumSectionRating + reviewData.rating
      sumClassRating = sumClassRating + reviewData.rating
      //Add to the number of reviews
      sumSectionReviews ++
      sumClassReviews ++

      // add the review to the SectionObject
      sectionObject.reviews.push(reviewObject)
    }
    // Add the average rating score and number of reviews to the sectionObject once out of the loop
    sectionObject.avgLectRating=sumSectionRating/sumSectionReviews
    sectionObject.sectionNumOfReviews = sumSectionReviews

    //Send the filled sectionObject to the returnValue
    returnValue.lecturers.push(sectionObject)
  
  }
  //Caclulate the overall adverage rating and number of reviews and add to returnValue
  returnValue.avgClassRating = sumClassRating/sumClassReviews
  returnValue.totalNumOfReviews = sumClassReviews

  // return the standard response
  return {
    statusCode: 200,
    body: JSON.stringify(returnValue)
  }
}