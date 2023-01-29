import React, {useState} from "react"

export function SpeakerTimeCount(props) {
const {attrs, assignments} = props.block;
const [warningGiven,setWarningGiven] = useState(false);
if(attrs.role != 'Speaker')
    return null;
const {time_allowed, count} = attrs;

let totaltime = 0;

assignments.forEach( (assignment, aindex) => {
    if(assignment.ID && (aindex < count))
        totaltime += parseInt(assignment.maxtime);
} );

if(!totaltime)
    return null;

function delayedNotification (message) {
    setTimeout(() => {
        props.makeNotification(message);
    },1000);
    setWarningGiven(true);
}

if(totaltime > time_allowed)
{
    if(!warningGiven)
        delayedNotification('Speakers have reserved '+totaltime+' minutes out of '+time_allowed+' allowed. Meeting organizers may change the time allowed for different parts of the meeting on the Organize tab.');
    return (<div>
        <p className="speakertime speakertime-warning">Speakers have reserved {totaltime} minutes out of {time_allowed} allowed</p>
    </div>);
}
else 
return (<div>
    <p className="speakertime">Speakers have reserved {totaltime} minutes out of {time_allowed} allowed</p>
</div>);

}
