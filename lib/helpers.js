var crypto = require('crypto');
const nodeMailer =  require('nodemailer')
const {google} = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const helpers = {}

helpers.sendEmail = async(reciever, subject, html)=>{
  const transporter = await nodeMailer.createTransport({
    host:"hotmail",
    auth:{
      user:`${process.env.MAIL_USER}`,
      pass:`${process.env.MAIL_PASS}`
    }
  });
  const sendMail = transporter.sendMail({
    from:"Kanan Abdullayev <kenanab9@gmail.com>",
    to:reciever,
    subject,
    text:html
  }, (error,info)=>{
    if(error) console.log(error);
    else console.log(info)
  });
}

// helpers.sendEmail("kenanab9@gmail.com", "Welcome Bro!", "Hello bro..");

helpers.isValidEmail = (email)=>{
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

helpers.randomString = (number)=>{
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';

  let id = '';
  // to make it's first element from alphabet
  id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));

  const characters = alphabet + digits;
  for (let i = 1; i < number; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return id;
}
helpers.parseJsonToObject = function(str){
  try{
    var obj = JSON.parse(str);
    return obj;
  } catch(e){
    return {};
  }
};

helpers.hash = function(str){
  if(typeof(str) == 'string' && str.length > 0){
    var hash = crypto.createHmac('sha256', process.env.HASHING_SECRET).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

helpers.convertTo3x3Array = (arr)=>{
  const result = [];
  for (let i = 0; i < arr.length; i += 3) {
    const subarray = arr.slice(i, i + 3);
    result.push(subarray);
  }
  return result;  
}

helpers.sortByPublishDate = (posts) => {
  const sortedPosts = [...posts];

  for (let i = 0; i < sortedPosts.length - 1; i++) {
    for (let j = i + 1; j < sortedPosts.length; j++) {
      const timeA = new Date(sortedPosts[i].publishDate);
      const timeB = new Date(sortedPosts[j].publishDate);
      
      if (timeB > timeA) {
        // Swap the positions of posts[i] and posts[j]
        const temp = sortedPosts[i];
        sortedPosts[i] = sortedPosts[j];
        sortedPosts[j] = temp;
      }
    }
  }

  return sortedPosts;
}

module.exports = helpers;