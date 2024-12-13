import { spawn } from 'child_process';
// Function to run Python script
function runPythonScript(scriptPath) {
    return new Promise((resolve, reject) => {
        // Run the command in a bash shell to properly source the virtual environment
        //Production source /home/pi/pytorch/bin/activate && 
        const pythonProcess = spawn('bash', ['-c', `python3 ${scriptPath}`]);

        let resultString = '';
        let errorString = '';

        // Capture output from the Python script
        pythonProcess.stdout.on('data', (data) => {
            resultString += data.toString();
        });

        // Capture errors from the Python script
        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        // Handle process close event
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(`Python script exited with code ${code}: ${errorString}`);
                return;
            }

            try {
                const jsonData = JSON.parse(resultString);
                resolve(jsonData);
            } catch (parseError) {
                reject(`Failed to parse JSON: ${parseError.message}`);
            }
        });
    });
}

let conveyorInterval; // Variable to store the interval ID for the conveyor
let stopInterval;
const categoryCommands = {
    plastic : 145,
    glass : 145,
    paper : 45,
    cardboard : 45
};
function runConveyorBelt(category,sendCommand) {
    console.log('Running conveyor belt');
    console.log('Garbage classification: ' + category);

    if (category !== 'metal' && category !== 'trash') {
        var angle = categoryCommands[category];
        sendCommand(`${category} ${angle}`);
    }

    // Start the conveyor belt
    sendCommand('go');

    // Set an interval to stop the conveyor belt
    stopInterval = setTimeout(() => {
        sendCommand('stop');
        console.log('Conveyor belt stopped');
    }, 15000); // Stop after 15 seconds

    // Adjust the servo angle after 5 seconds
    if (category !== 'metal' && category !== 'trash') {
        conveyorInterval = setTimeout(() => {
            sendCommand(`${category} 90`);
        }, 5000);
    }
}
export {
    runPythonScript,
    runConveyorBelt
}