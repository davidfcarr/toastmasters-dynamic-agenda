import React, {useState} from "react"

export function SpeakerTimeCount(props) {
const {attrs, assignments, makeNotification} = props.block;
const [warningGiven,setWarningGiven] = useState(false);
if(attrs.role != 'Speaker')
    return null;
const {time_allowed, count} = attrs;
const time_allowed_text = (time_allowed) ? ' out of '+time_allowed+' allowed': '';
let totaltime = 0;

Array.isArray(assignments) && assignments.forEach( (assignment, aindex) => {
    if(assignment.ID && (aindex < count))//count time for speakers but not backup speaker
        totaltime += parseInt(assignment.maxtime);
} );

if(!totaltime)
    return null;

function delayedNotification (message) {
    if(!makeNotification)
        return;
    setTimeout(() => {
        makeNotification(message);
    },1000);
    setWarningGiven(true);
}

if(totaltime > time_allowed)
{
    if(!warningGiven)
        delayedNotification('Speakers have reserved '+totaltime+' minutes'+time_allowed_text+'. Meeting organizers may change the time allowed for different parts of the meeting on the Organize tab.');
    return (<div>
        <p className="speakertime speakertime-warning">Speakers have reserved {totaltime} minutes{time_allowed_text}</p>
    </div>);
}
else 
return (<div>
    <p className="speakertime">Speakers have reserved {totaltime} minutes{time_allowed_text}</p>
</div>);

}
