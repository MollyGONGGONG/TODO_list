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
      let listTemplate = `<li><span>${todo.content}</span>
    <button class="delete-btn" id="${todo.id}">delete</button>
    <button class="edit-btn" id="${todo.id}">edit</button>
    <button class="move-btn" id="${todo.id}">move to complete</button></li>`;

      let todoPending = listTemplate;
      let todoComplete = listTemplate;

      !todo.isCompleted
        ? (todosPendingTemplate += todoPending)
        : (todosCompleteTemplate += todoComplete);
    });
    if (todos.length === 0 || todosPendingTemplate === "") {
      todosPendingTemplate = "<h4>no task to display!</h4>";
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
        const originalContent = todoItemEl.textContent;
        todoItemEl.innerHTML = `<input type='text' value='${originalContent}' />`;
        const inputEl = todoItemEl.querySelector("input");
        inputEl.focus();
        inputEl.addEventListener("blur", () => {
          const newContent = inputEl.value;
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
      if (event.target.className === "move-btn") {
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
