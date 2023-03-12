// create new fetch method
const myFetch = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(options.method || "GET", url);
    xhr.onload = function () {
      const headers = {};
      xhr
        .getAllResponseHeaders()
        .trim()
        .split("\n")
        .forEach((header) => {
          const [name, value] = header.split(":");
          headers[name.trim()] = value.trim();
        });
      const response = {
        url: xhr.responseURL,
        status: xhr.status,
        statusText: xhr.statusText,
        headers: headers,
        text: () => Promise.resolve(xhr.responseText),
        json: () => Promise.resolve(JSON.parse(xhr.responseText)),
      };
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(response);
      } else {
        reject(response);
      }
    };
    xhr.onerror = function () {
      reject(new TypeError("Network request failed"));
    };
    xhr.ontimeout = function () {
      reject(new TypeError("Network request failed"));
    };
    xhr.withCredentials = options.credentials === "include";
    Object.keys(options.headers || {}).forEach((name) => {
      xhr.setRequestHeader(name, options.headers[name]);
    });
    xhr.send(options.body);
  });
};

const APIs = (() => {
  const createTodo = (newTodo) => {
    return myFetch("http://localhost:3000/todos", {
      method: "POST",
      body: JSON.stringify(newTodo),
      headers: { "Content-Type": "application/json" },
    }).then((res) => res.json());
  };

  const deleteTodo = (id) => {
    return myFetch("http://localhost:3000/todos/" + id, {
      method: "DELETE",
    }).then((res) => res.json());
  };

  const updateTodo = (id, updatedTodo) => {
    return myFetch("http://localhost:3000/todos/" + id, {
      method: "PATCH",
      body: JSON.stringify(updatedTodo),
      headers: { "Content-Type": "application/json" },
    }).then((res) => res.json());
  };

  const getTodos = () => {
    return myFetch("http://localhost:3000/todos").then((res) => res.json());
  };
  return { createTodo, deleteTodo, getTodos, updateTodo };
})();

const Model = (() => {
  class State {
    #todos; //private field
    #onChange; //function, will be called when setter function todos is called
    constructor() {
      this.#todos = [];
    }
    get todos() {
      return this.#todos;
    }
    set todos(newTodos) {
      // reassign value
      console.log("setter function");
      this.#todos = newTodos;
      this.#onChange?.(); // rendering
    }

    subscribe(callback) {
      //subscribe to the change of the state todos
      this.#onChange = callback;
    }
  }

  const { getTodos, createTodo, deleteTodo, updateTodo } = APIs;

  return {
    State,
    getTodos,
    createTodo,
    deleteTodo,
    updateTodo,
  };
})();

const View = (() => {
  const todolistEl = document.querySelector(".todo-list-pending");
  const completeListEl = document.querySelector(".todo-list-completed");
  const submitBtnEl = document.querySelector(".submit-btn");
  const inputEl = document.querySelector(".input");

  const renderTodos = (todos) => {
    let todosPendingTemplate = "";
    let todosCompleteTemplate = "";

    todos.forEach((todo) => {
      let todoPending = `<li><span>${todo.content}</span>
      <button class="delete-btn" id="${todo.id}">
      <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" aria-label="fontSize small"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
      </button>
  
      <button class="edit-btn" id="${todo.id}"><svg focusable="false" aria-hidden="true" viewBox="0 0 24 24"  aria-label="fontSize small"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg></button>
      <button class="move-btn-right" id="${todo.id}"><svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ArrowForwardIcon" aria-label="fontSize small"><path d="m12 4-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"></path></svg></button></li>`;

      let todoComplete = `<li><span>${todo.content}</span>
      <button class="delete-btn" id="${todo.id}">
      <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" aria-label="fontSize small"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
      </button>
  
      <button class="edit-btn" id="${todo.id}"><svg focusable="false" aria-hidden="true" viewBox="0 0 24 24"  aria-label="fontSize small"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg></button>
      <button class="move-btn-left" id="${todo.id}"><svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" aria-label="fontSize small"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg></button></li>`;

      !todo.isCompleted
        ? (todosPendingTemplate += todoPending)
        : (todosCompleteTemplate += todoComplete);
    });
    if (todos.length === 0 || todosPendingTemplate === "") {
      todosPendingTemplate = "<h4>no task to display!</h4>";
    }
    if (todos.length === 0 || todosCompleteTemplate === "") {
      todosCompleteTemplate = "<h4>no task to display!</h4>";
    }
    todolistEl.innerHTML = todosPendingTemplate;
    completeListEl.innerHTML = todosCompleteTemplate;
  };

  const clearInput = () => {
    inputEl.value = "";
  };

  return {
    renderTodos,
    submitBtnEl,
    inputEl,
    clearInput,
    todolistEl,
    completeListEl,
  };
})();

const Controller = ((view, model) => {
  const state = new model.State();

  const init = () => {
    model.getTodos().then((todos) => {
      todos.reverse();
      state.todos = todos;
    });
  };

  const handleSubmit = () => {
    view.submitBtnEl.addEventListener("click", (event) => {
      const inputValue = view.inputEl.value.trim();
      if (inputValue) {
        model
          .createTodo({ content: inputValue, isCompleted: false })
          .then((data) => {
            state.todos = [data, ...state.todos];
            view.clearInput();
          });
      }
    });
  };

  const handleEdit = () => {
    function editTodo(event) {
      if (event.target.className === "edit-btn") {
        const todoItemEl = event.target.parentNode.querySelector("span");
        //console.log(todoItemEl);
        const originalContent = todoItemEl.textContent;
        todoItemEl.innerHTML = `<input type='text' value='${originalContent}' />`;
        const inputEl = todoItemEl.querySelector("input");
        console.log(inputEl);

        inputEl.focus();
        inputEl.addEventListener("blur", () => {
          const newContent = inputEl.value;
          console.log(newContent);
          if (newContent && newContent !== originalContent) {
            const id = event.target.id;
            const updatedTodo = { id: +id, content: newContent };
            model.updateTodo(id, updatedTodo).then((data) => {
              state.todos = state.todos.map((todo) =>
                todo.id === data.id ? data : todo
              );
            });
          } else {
            todoItemEl.innerHTML = originalContent;
          }
        });
      }
    }
    view.todolistEl.addEventListener("click", editTodo);
    view.completeListEl.addEventListener("click", editTodo);
  };

  const handleDelete = () => {
    function deleteTodo(event) {
      if (event.target.className === "delete-btn") {
        const id = event.target.id;
        console.log("id", typeof id);
        model.deleteTodo(+id).then((data) => {
          state.todos = state.todos.filter((todo) => todo.id !== +id);
        });
      }
    }
    view.todolistEl.addEventListener("click", deleteTodo);
    view.completeListEl.addEventListener("click", deleteTodo);
  };

  const handleMove = () => {
    function moveTodo(event) {
      if (
        event.target.className === "move-btn-right" ||
        event.target.className === "move-btn-left"
      ) {
        const id = event.target.id;
        const todo = state.todos.find((todo) => todo.id === Number(id));
        todo.isCompleted = !todo.isCompleted; //isCompleted true or false: toggled
        console.log(todo);
        model.updateTodo(id, todo).then((data) => {
          state.todos = state.todos.filter((todo) => todo.id !== Number(id));
          state.todos = [data, ...state.todos];
        });
      }
    }
    view.todolistEl.addEventListener("click", moveTodo);
    view.completeListEl.addEventListener("click", moveTodo);
  };

  const bootstrap = () => {
    init();
    handleSubmit();
    handleDelete();
    handleEdit();
    handleMove();

    state.subscribe(() => {
      view.renderTodos(state.todos);
    });
  };
  return {
    bootstrap,
  };
})(View, Model); //ViewModel

Controller.bootstrap();
