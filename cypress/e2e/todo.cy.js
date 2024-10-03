describe('E2E Game Play and Claim with Continuous Loop', () => {
  it('should continuously play the game and claim points', () => {

    // Define the recursive function that will handle the entire process
    const gamePlayAndClaim = () => {
      
      // Step 1: Hit the 'game play' endpoint
      cy.request({
        method: 'POST',
        url: 'https://game-domain.blum.codes/api/v1/game/play', // The game play API endpoint
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJoYXNfZ3Vlc3QiOmZhbHNlLCJ0eXBlIjoiQUNDRVNTIiwiaXNzIjoiYmx1bSIsInN1YiI6IjRjYTQ0NTFiLTA2NDQtNGE1Ni1hZTQxLTY4OTgwNjY2YzUyNCIsImV4cCI6MTcyNzkzMDMxMiwiaWF0IjoxNzI3OTI2NzEyfQ.FUs6BmtiXhNzUWx1-9ycLs5cbXfTd3pMSx0UCNZiBZ8`, // Replace with a valid JWT token
        },
        body: {
          // Add any payload needed for the game play API
        }
      }).then((response) => {
        // Ensure the response is successful
        expect(response.status).to.eq(200);

        // Extract the gameId from the response
        const gameId = response.body.gameId;
        expect(gameId).to.be.a('string'); // Ensure gameId exists and is a string

        // Step 2: Start polling the 'game claim' endpoint until the session is finished
        const claimPoints = (attempt = 0) => {
          cy.log(`Attempt: ${attempt + 1}`); // Log the attempt count

          cy.request({
            method: 'POST',
            url: 'https://game-domain.blum.codes/api/v1/game/claim', // The game claim API endpoint
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJoYXNfZ3Vlc3QiOmZhbHNlLCJ0eXBlIjoiQUNDRVNTIiwiaXNzIjoiYmx1bSIsInN1YiI6IjRjYTQ0NTFiLTA2NDQtNGE1Ni1hZTQxLTY4OTgwNjY2YzUyNCIsImV4cCI6MTcyNzkzMDMxMiwiaWF0IjoxNzI3OTI2NzEyfQ.FUs6BmtiXhNzUWx1-9ycLs5cbXfTd3pMSx0UCNZiBZ8`, // Replace with a valid JWT token
            },
            body: {
              gameId: gameId, // Use the gameId from the previous API response
              points: 300     // Pass any additional data, like points
            },
            failOnStatusCode: false // Prevent test failure on non-200 status
          }).then((claimResponse) => {
            if (claimResponse.status === 200 && claimResponse.body.message !== 'game session not finished') {
              // Success: Game session is finished, and the claim is processed
              cy.log('Game claim successful:', claimResponse.body);

              // Restart the entire process after a successful claim
              cy.log('Restarting the game play and claim process...');
              gamePlayAndClaim(); // Recursively call the function to start again
            } else if (claimResponse.status === 400 && claimResponse.body.message === 'game session not finished') {
              // Game session not finished, retry after delay
              cy.log('Game session not finished. Retrying...');
              
              // Retry after a delay of 3 seconds (3000 ms)
              cy.wait(3000).then(() => {
                claimPoints(attempt + 1); // Recursively retry the claimPoints function
              });
            } else {
              // Handle unexpected responses
              throw new Error(`Unexpected response: ${claimResponse.status} - ${claimResponse.body.message}`);
            }
          });
        };

        // Start the first claim attempt
        claimPoints();
      });
    };

    // Start the first game play and claim process
    gamePlayAndClaim();
  });
});
