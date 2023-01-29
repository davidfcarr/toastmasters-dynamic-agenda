import React from "react"

export function MoveAssignment(props) {
    const {roleindex, blockindex, assignments, updateAssignment} = props;

    function moveItem(roleindex, newindex) {
        let prev = {...assignments};
            let myassignment = prev[roleindex];
            let newassignments = [];
            prev.forEach((prevassignment,previndex) => {
                if((previndex == newindex) && (newindex < roleindex)) {
                    newassignments.push(myassignment); //insert before
                    newassignments.push(prevassignment);
                }
                else if((previndex == newindex) && (newindex > roleindex)) {
                    newassignments.push(prevassignment);
                    newassignments.push(myassignment); //insert after
                }
                else if(previndex != roleindex) // skip spot my assignment previously occupied
                   newassignments.push(prevassignment);
            });
            updateAssignment(newassignments,blockindex);
    }

    function UpButton () {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-up-circle" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/></svg>
        )
    }

    function DownButton () {
        return (
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down-circle" viewBox="0 0 16 16">
<path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V4.5z"/>
</svg>
        )
    }
    let indexend = assignments.length; // (props.backup) ? roles.length -1 : roles.length;
    //todo - logic for backup

    return (
        <p>Test</p>
    )

    return (
<p>{(roleindex > 1) && (<><button  className="tmform" onClick={() => {moveItem(roleindex,0)}}> Move to Top</button><button  className="tmform" onClick={() => {moveItem(roleindex, roleindex-1)}}> Move Up</button></>)} 
{(roleindex < indexend) && <button className="tmform" onClick={() => {moveItem(roleindex, roleindex+1)}}> Move Down</button>}</p>
    );
}
          