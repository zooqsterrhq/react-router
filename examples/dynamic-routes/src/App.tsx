import * as React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useParams,
  useLocation
} from "react-router-dom";

export default function App() {
  return (
    <Router>
      <div>
        <h1>Welcome to the app!</h1>

        <Routes>
          <Route index element={<Navigate to="/0" />} />
          <Route path="/:id/*" element={<Person />} />
        </Routes>
      </div>
    </Router>
  );
}

function Person() {
  let { id } = useParams();
  let location = useLocation();
  let person = findPerson(Number(id));

  if (!person) {
    return <div>Person not found</div>;
  }

  return (
    <div>
      <h3>{person.name}'s Friends</h3>

      <ul>
        {person.friends.map(fid => {
          let friend = findPerson(fid);
          if (!friend) return <React.Fragment key={id} />;
          return (
            <li key={fid}>
              <Link to={`${location.pathname}/${fid}`}>{friend.name}</Link>
            </li>
          );
        })}
      </ul>

      <Routes>
        <Route path={location.pathname + "/:id"} element={<Person />} />
      </Routes>
    </div>
  );
}

let PEEPS = [
  { id: 0, name: "Michelle", friends: [1, 2, 3] },
  { id: 1, name: "Sean", friends: [0, 3] },
  { id: 2, name: "Kim", friends: [0, 1, 3] },
  { id: 3, name: "David", friends: [1, 2] }
];

function findPerson(id: number) {
  return PEEPS.find(p => p.id === id);
}
