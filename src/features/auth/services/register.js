'use strict'

const prisma = require("../../../config/prisma.config")
const bcrypt = require("bcrypt")

const { ErrorWithStatusCode } = require('./../../../middleware/errorHandler');

const registerUser = async function(name, email, password){
    console.log(email)
   try {

     const isEmailAlreadyExist = await prisma.users.findUnique({
        where : {
            email : email
        }
     })

     if(isEmailAlreadyExist) {
        throw new ErrorWithStatusCode("Email is already used", 409)
     }


   //   const isPhoneNumberAlreadyExist = await prisma.users.findFirst({
   //      where : {
   //          phone_number : phoneNumber
   //      }
   //   })

   //   if(isPhoneNumberAlreadyExist) {
   //      throw new ErrorWithStatusCode("Phone Number is already used", 409)
   //   }

     const hashedPassword = await bcrypt.hash(password, 10)

     const user = await prisma.users.create({
        data : {
            name : name,
            email : email,
            password : hashedPassword,
            created_at : new Date()
        }
     })

     const otp = generateOTP()
     const currentTime = new Date();
     const expiredAt = new Date(currentTime.getTime() + 10 * 60000);

     const result = await prisma.otps.create({
        data : {
            otp_code : String(otp),
            created_at : new Date(),
            expired_at : expiredAt,
            user_id : user.id
        }
     })
   
     console.log(result)

     return result.otp_code

   } catch (err) {

    throw err
   
   }
}


function generateOTP() {
    let otp = '';
    for (let i = 0; i < 6; i++) {
        otp += Math.floor(Math.random() * 10); 
    }
    return otp;
}

module.exports = { registerUser };