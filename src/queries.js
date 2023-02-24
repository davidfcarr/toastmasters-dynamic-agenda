import React from "react"
import apiClient from './http-common.js';
import {useQuery,useMutation, useQueryClient} from 'react-query';

export function useBlocks(post_id) {
    console.log('use blocks called with post id',post_id);
    function fetchBlockData(queryobj) {
        const post_id = queryobj.queryKey[1];
        console.log('fetch block data post id',post_id);
        return apiClient.get('blocks_data/'+post_id);
    }
    return useQuery(['blocks-data',post_id], fetchBlockData, { enabled: true, retry: 2, onSuccess, onError, refetchInterval: 60000 });
}
    
async function updateAgendaPost (agenda) {
    return await apiClient.post('update_agenda', agenda);
}

export function initSendEvaluation(post_id, setSent, makeNotification) {
    async function postEvaluation (evaluation) {
        evaluation.post_id = post_id;
        return await apiClient.post('evaluation', evaluation);
    }
    
    return useMutation(postEvaluation, {
        onSuccess: (data, error, variables, context) => {
            console.log('evaluation sent',data);
            console.log('onsuccess variables', variables);
            makeNotification(data.data.status);
            setSent(data.data.message);
        },
        onError: (err, variables, context) => {
            console.log('mutate assignment error');
            console.log(err);
          },
    
          }
)
}

export function initChangeBlockAttribute(post_id,blockindex) {
    const queryClient = useQueryClient();
    const prev = queryClient.getQueryData(['blocks-data',post_id]);
    function changeBlockAttribute(key,value) {
        const prevdata = prev.data;
        prevdata.blocksdata[blockindex].attrs[key] = value;
        console.log('changed prevdata',prevdata);
        return prevdata;
    }
    return changeBlockAttribute;
}

export function updateAgenda(post_id,makeNotification,Inserter = null) {
    const queryClient = useQueryClient();
    return useMutation(updateAgendaPost, {
        onMutate: async (agenda) => {
            await queryClient.cancelQueries(['blocks-data',post_id]);
            const previousValue = queryClient.getQueryData(['blocks-data',post_id]);
            queryClient.setQueryData(['blocks-data',post_id],(oldQueryData) => {
                //function passed to setQueryData
                const {data} = oldQueryData;
                const newdata = {
                    ...oldQueryData, data: {...data,blocksdata: agenda.blocksdata}
                };
                console.log('modified query to return',newdata);
                return newdata;
            }) 
            makeNotification('Updating ...');
            if(Inserter && Inserter.setInsert)
                Inserter.setInsert('');
            return {previousValue}
        },
        onSettled: (data, error, variables, context) => {
            console.log('onsettled variables', variables);
            queryClient.invalidateQueries(['blocks-data',variables.post_id]);
            makeNotification('Updated');
        },
        onError: (err, variables, context) => {
            console.log('mutate assignment error');
            console.log(err);
            queryClient.setQueryData("blocks-data", context.previousValue);
          },
    
          }
)
}

function onSuccess(e) {
        if(e.current_user_id) {
            setCurrentUserId(e.current_user_id);
            setPostId(e.post_id);
            console.log('user id on init '+e.post_id);
        }
        console.log('downloaded data',e);
    }
function onError(e) {
    console.log('error downloading data',e);
}

export function useEvaluation(project,evalSuccess) {
    function fetchEvaluation(queryobj) {
        return apiClient.get('evaluation/?project='+project);
    }
    return useQuery(['evaluation',project], fetchEvaluation, { enabled: true, retry: 2, onSuccess: evalSuccess, onError, refetchInterval: false });
}
