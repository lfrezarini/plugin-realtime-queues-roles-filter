import * as Flex from '@twilio/flex-ui';
import { supervisors } from '../config/supervisors.json';

const setTeamsFilters = (manager) => {

    const { attributes } = manager.workerClient;

    const supervisor = supervisors.find(({ email }) => email === attributes.email) || { queues: [] };

    let filters = [
        {
            id: "data.attributes.routing.skills",
            title: "Queue",
            fieldName: "queue",
            type: "multiValue",
            condition: "IN",
            options: supervisor.queues.map((queue) => ({
                value: queue,
                label: queue,
                default: false
            }))
        },
        
    ];
    
    Flex.TeamsView.defaultProps.filters = [
        Flex.TeamsView.activitiesFilter,
        ...filters,
    ];


}

const applyDefaultFilters = (manager) => {

    const { REACT_APP_SELECTION_ATTRIBUTE } = process.env;
    const { attributes: { [REACT_APP_SELECTION_ATTRIBUTE] : worker_selection_value } } = manager.workerClient;

    const store = manager.store;

    store.subscribe(() => {

        const action = store.getState()["realtime-queues-roles-filter"].view.lastAction;

        if(action.type === "VIEW_UPDATE_FILTER"){
        
            if(!action.payload.filterByPermission) {

            const { dispatch } = store;

            dispatch({
                type: action.type,
                payload: {
                ...action.payload,
                    filters: [
                        ...action.payload.filters,
                        {
                            condition: "IN",
                            name: `data.attributes.${REACT_APP_SELECTION_ATTRIBUTE}`,
                            values: worker_selection_value
                        }
                    ],
                    filterByPermission: true
                }
            });

            }

        }

    });

}

export {
    setTeamsFilters,
    applyDefaultFilters
}