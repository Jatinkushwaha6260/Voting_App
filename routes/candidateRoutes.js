const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const Candidate = require('./../models/candidate');
const {jwtAuthMiddleware , generateToken} = require('./../jwt');

const checkAdminRole = async (userId) => {
    try{
        const user = await User.findById(userId);
        return user.role === 'admin';

    }catch(err){
        return false;

    }
}


//   Add candidate By Post method
router.post('/' , jwtAuthMiddleware , async (req , res) => {
    try{
        if(! await checkAdminRole(req.user.id))
            return res.status(403).json({message: 'user does not have admin role'});

        const data = req.body; // Assuming the request body contains the candidate data

        // Create a new candidate document using the mongoose model
        const newCandidate = new Candidate(data);

        // save the new candidate to the database
        const response = await newCandidate.save();
        console.log('data saved');

        res.status(200).json({response: response});

    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal server error'});

    }
      
});



// Update candidate By Put method
router.put('/:candidateId' , jwtAuthMiddleware , async (req , res) => {
    try{
         if(!checkAdminRole(req.user.id))
            return res.status(403).json({message: 'user does not have admin role'});

         const candidateId = req.params.candidateId; // Extract the id from the URL parameter
         const updatedCandidateData = req.body; // Updated data for the candidate
         const response = await Candidate.findByIdAndUpdate(candidateId , updatedCandidateData , {
            new: true, // Return the updated document
            runValidators: true // Run mongoose validation
         })

         if(!response){
            return res.status(403).json({message: 'candidate not found'});
         }

         console.log('candidate data updated');
         res.status(200).json(response);

        
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal server error'});

    }
});


// Delete candidate By Delete method
router.delete('/:candidateId' , jwtAuthMiddleware , async (req , res) => {
    try{
    if(!checkAdminRole(req.user.id))
            return res.status(403).json({message: 'user does not have admin role'});

    const candidateId = req.params.candidateId; // Extract the id from the URL parameter
    const response = await Candidate.findByIdAndDelete(candidateId);

    if(!response){
        return res.status(403).json({message: 'candidate not found'});
    }

    console.log('candidate deleted');
    res.status(200).json({response: 'candidate deleted'});

}catch(err){
    console.log(err);
        res.status(500).json({error: 'Internal server error'});
}
});

// Let's started voting



module.exports = router;