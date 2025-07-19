const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const {jwtAuthMiddleware , generateToken} = require('./../jwt');

// Signup route by post method
router.post('/signup' , async (req , res) => {
    try{
        const data = req.body; // Assuming the request body contains the user data

        // Create a new user document using the mongoose model
        const newUser = new User(data);

        // save the new user to the database
        const response = await newUser.save();
        console.log('data saved');

        const payload = {
            id: response.id
        }

        console.log(JSON.stringify(payload));
        const token = generateToken(payload);
        console.log("Token is:" , token);

        res.status(200).json({response: response , token: token});

    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal server error'});

    }
      
});

// Login route by post method
router.post('/login' , async (req , res) => {
    try{
        // Extract aadharCardNumber and password fron request body
        const {aadharCardNumber , password}  = req.body;

        // Find the user by aadharCardNumber
        const user = await User.findOne({aadharCardNumber: aadharCardNumber});

        // If user does not exist or password does not match , return error
        if(!user || !(await user.comparePassword(password))){
            return res.status(401).json({error: 'Invalid user or  password'});
        }

        // generate token
        const payload = {
            id: user.id
        }
        const token = generateToken(payload);

        // return token as response
        res.json({token});


    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal server error'});

    }
});

// Profile route by get method
router.get('/profile' , async (req , res) => {
    try{
    const userData = req.user;
    const userId = userData.id;
    const user = await User.findById(userId);
    res.status(200).json({user});
}catch(err){
    console.log(err);
    res.status(500).json({error: 'Internal server error'});

}
});

// Profile password change route by put method
router.put('/profile/password' , async (req , res) => {
    try{
        const userId = req.user; // Extract the id from the token
        const {currentPassword , newPassword}  = req.body; // Extract current and new passwords from the request body

        // find the user by userId
        const user = await User.findById(userId);
        
        // If password does not match , return error
        if(!(await user.comparePassword(currentPassword))){
            return res.status(401).json({error: 'password does not match'})
        }

        // update the user's password
        user.password = newPassword;
        await user.save();
        console.log('password updated');
        res.status(200).json({message: 'password updated'});

    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal server error'});

    }
});



module.exports = router;




