import * as React from 'react';

export interface UIProps {
    newTaskName: string,
}

export interface List {
    name: string,
    items: ListItem[],
}

export interface ListItem {
    id: string,
    name: string,
}

export interface AppProps {
    list: List,
    ui: UIProps,
    onNewTaskInput: (string) => {},
    onNewTaskSubmit: () => {},
}

export interface AppState {
    
}

export default class App extends React.PureComponent<AppProps, AppState> {
    render() {
        const {list, ui} = this.props;

        return (
            <div>
                <span>{list.name}</span>
                <form onSubmit={this.onAddItem_}>
                    <span>{list.items.length}</span>
                    <input onInput={this.onTaskInputUpdated_} value={ui.newTaskName || ''} data-aid='NewTaskName' />
                    <button>Add item</button>
                </form>
                {list.items.reverse().map((item) => { return <li key={item.id}>{item.name}{this.savingIndicator_(item)}</li> })}
            </div>
        );
    }

    savingIndicator_ = (item) => {
        if (item.pending) {
            return (<span>(saving)</span>);
        } else {
            return null;
        }
    };

    onTaskInputUpdated_ = (e) => {
        this.props.onNewTaskInput(e.target.value);
    };

    onAddItem_ = (e) => {
        e.preventDefault();
        this.props.onNewTaskSubmit();
    };
}