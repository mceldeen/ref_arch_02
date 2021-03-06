import * as list from './core/list';

export function init(commands, events, latestVersion) {
    return {
        commands,
        events,
        latestVersion,
    };
}

export function commands(state) {
    return state.commands;
}

export function events(state) {
    return state.events;
}

export function syncWithServer(listId, store, fetchSyncState, fetchEvents) {
    processCommands(listId, store, fetchSyncState);
    pollForEvents(listId, store, fetchSyncState, fetchEvents);
}

export function handleAction(state, action) {
    switch (action.type) {
        case 'commandQueued':
            switch (action.command.type) {
                case 'addItem':
                    return {
                        ...state,
                        commands: state.commands.concat([action.command])
                    };
            }
        case 'commandSuccessfullyExecutedOnServer':
            return {
                ...state,
                events: state.events.concat([action.event]),
                commands: state.commands.slice(1),
                latestVersion: state.latestVersion + 1,
            };
        case 'outOfDate':
            return {
                ...state,
                events: state.events.concat(action.missingEvents),
                latestVersion: state.latestVersion + action.missingEvents.length,
            };
        case 'eventsReceived':
            if (state.commands.length > 0) {
                return state;
            } else {
                if (action.latestVersion > state.latestVersion) {
                    return {
                        ...state,
                        events: state.events.concat(action.events),
                        latestVersion: action.latestVersion,
                    };
                } else {
                    return state;
                }
            }
        default:
            return state;
    }
}


function pollForEvents(listId, store, fetchSyncState, fetchEvents) {
    setTimeout(() => {
        fetchEvents(listId, fetchSyncState(store).latestVersion + 1).then((eventRecords) => {
            if (eventRecords.length > 0) {
                store.dispatch({
                    type: 'eventsReceived',
                    events: eventRecords.map(eventRecord => eventRecord.eventData),
                    latestVersion: eventRecords.length > 0 ? eventRecords[eventRecords.length - 1].listVersion : undefined,
                });
            }
            pollForEvents(listId, store, fetchSyncState, fetchEvents);
        });
    }, 1000);
}

function executeCommand(state, command) {
    const validationState = list.buildState(list.eventHandlers, state.events, list.emptyState());
    return list.commandHandlers.addItem(command, validationState);
}

function processCommands(listId, store, fetchSyncState) {
    let processingCommands = false;
    const processNextCommand = () => {
        const state = fetchSyncState(store);
        if (state.commands.length >= 1 && !processingCommands) {
            processingCommands = true;
            const command = state.commands[0];
            const {type} = executeCommand(state, command);

            if (type === 'ok') {
                const body = {
                    clientVersion: state.latestVersion,
                    command: command,
                };

                return fetch(`/${listId}/commands`, {
                    method: "POST",
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(body)
                }).then((res) => res.json()).then((resData) => {
                    if (resData.type === 'success') {
                        store.dispatch({type: 'commandSuccessfullyExecutedOnServer', event: resData.event});
                    } else if (resData.type === 'outOfDate') {
                        store.dispatch({type: 'outOfDate', missingEvents: resData.missingEvents});
                    } else {
                        store.dispatch({type: 'commandFailureResponse', err: resData});
                    }
                    processingCommands = false;
                    processNextCommand();
                });
            } else {
                return null;
            }
        }
    };
    store.subscribe(processNextCommand);
}