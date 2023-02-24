import React, {useState, useEffect} from "react"
import { SelectControl } from '@wordpress/components';
import {useQuery,useMutation, useQueryClient} from 'react-query';
import apiClient from './http-common.js';

export function Absence(props) {
    const {current_user_id, post_id, mode} = props;
    const [addtolist,setAddToList] = useState(0);
    const [until,setUntil] = useState('');

    const { isLoading, isFetching, isSuccess, isError, data, error, refetch} =
    useQuery(['absences-data',post_id], fetchAbsences, { enabled: true, retry: 2, onSuccess, onError, refetchInterval: 60000 });
    function fetchAbsences() {
        return apiClient.get('absences?post_id='+post_id);
    }
    function onSuccess(data) {
        console.log(data);
    }
    function onError(err, variables, context) {
        console.log(err);
    }

    const queryClient = useQueryClient();

    const absMutation = useMutation(
        async (addremove) => { return await apiClient.post("absences?post_id="+post_id, addremove)},
        {
            onMutate: async (addremove) => {
                console.log('addremove',addremove);
                console.log('addremove api client',apiClient);
                await queryClient.cancelQueries(['absences-data',post_id]);
                const previousData = queryClient.getQueryData(['blocks-data',post_id]);
                queryClient.setQueryData(['absences-data',post_id],(oldQueryData) => {
                    const {data} = oldQueryData;
                    const {absences} = data;
                    if('add' == addremove.operation)
                        absences.push({'ID':addremove.ID,'name':addremove.name});
                    else if('remove' == addremove.operation)
                        absences.splice(addremove.index,1);
                    const newdata = {
                        ...oldQueryData, data: {...data,absences: absences}
                    };
                    //console.log('modified query to return',newdata);
                    return newdata;
                }) 
                makeNotification('Updating ...');
                return {previousData}
            },
            onSettled: (data, error, variables, context) => {
                queryClient.invalidateQueries(['absences-data',post_id]);
                makeNotification('Updated absences');
            },
            onError: (err, variables, context) => {
                console.log('mutate assignment error',err);
                queryClient.setQueryData("absences-data", context.previousData);
            },
        }
    );

    function getMemberName(id) {
        console.log('get member name, memberlist',memberlist);
        let m = memberlist.find( (item) => {console.log('member item',item); if(item.value == id) return item; } );
        console.log('member return ',m);
        return m?.label;
    }

    function removeAbsence(id,index,until) {
        absMutation.mutate({'operation':'remove','index':index,'ID':id,'until':until});
    }
    function addAbsence(id) {
        absMutation.mutate({'operation':'add','ID':id,'name':getMemberName(id),'until':until});
    }
    if(isLoading)
    return <div>Loading absences list ...</div>
    
    const {absences, upcoming,memberlist} = data.data; 
    console.log('absences before foreach',absences);

    let absentIndex = -1;
    let meuntil = '';
    absences.forEach((ab, index) => {
        if(ab.ID == current_user_id)
            {
                absentIndex = index;
            }
    });
    
    if('edit' == mode)
    return (<div className="absence">
        <h3>Planned Absences</h3>
        {absences.map( (ab, index) => {
            return <p><button className="tmform" onClick={() => {removeAbsence(ab.ID,index,ab.until);} }>Remove</button> {ab.name} {(ab.until != '') && <em>until {ab.until}</em>}</p>
        } ) }
        <SelectControl label="Add Member to List" value={addtolist} options={memberlist} onChange={(id) => { setAddToList(id) }} />
        <SelectControl label="One meeting or several?" options={upcoming} value={until} onChange={setUntil} />
        <button className="tmform" onClick={() => {addAbsence(addtolist)} }>Add</button>
    </div>);

    //signup mode
    return (<div className="absence">
    <h3>Planned Absences</h3>
    {absences.map( (ab) => {
    return <p>{ab.name} {(ab.until != '') && <em>until {ab.until}</em>}</p>
    } ) }
    {(absentIndex < 0) && <SelectControl label="One meeting or several?" options={upcoming} value={until} onChange={setUntil} />}
    <p>{(absentIndex > -1) && <button className="tmform" onClick={() => {removeAbsence(current_user_id,absentIndex)} }>Remove Me</button>} {(absentIndex < 0) && <button  className="tmform" onClick={() => {addAbsence(current_user_id)} }>Add Me</button>}</p>
    </div>);
}