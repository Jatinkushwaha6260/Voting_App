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
router.post('/vote/:candidateId' , jwtAuthMiddleware , async (req , res) => {
    // no admin can vote
    // user can only vote once
    candidateId = req.params.candidateId;
    userId = req.user.id;

    try{
        // Find the candidate document with the specified candidateId
        const candidate = await Candidate.findById(candidateId);
        if(!candidate){
            return res.status(404).json({message: 'candidate not found'});

        }
        
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({message: 'user not found'});
        }

        if(user.isVoted){
            return res.status(400).json({message: 'you have already voted'});
        }

        if(user.role == 'admin'){
            return res.status(403).json({message: 'admin is not allowed'});
        }

        // Update the candidate document to record the vote
        candidate.votes.push({user: userId});
        candidate.voteCount++;
        await candidate.save();

        // Update the user document
        user.isVoted = true;
        await user.save();

        res.status(200).json({message: 'vote recorded successfully'});

    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal server error'});

    }
});


// Find vote count
router.get('/vote/count' , async (req , res) => {
    try{
        // Find all candidates and sort them by voteCount in decending order
        const candidate = await Candidate.find().sort({voteCount: 'desc'});

       // Map the candidates to only return their name and voteCount
       const voteRecord = candidate.map((data) => {
        return {
            party: data.party,
            voteCount: data.voteCount
        }
       });

       return res.status(200).json(voteRecord);


    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }
});




module.exports = router;