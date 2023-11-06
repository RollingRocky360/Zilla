[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-24ddc0f5d75046c5622901739e7c5dd533143b0c8e959d652212380cedb1ea36.svg)](https://classroom.github.com/a/M4NvrXuV)

### Name: Gagan Sai C S <br> Email: gagansai2010795@ssn.edu.in

### Live Link: https://zilla-software.onrender.com <br>  May be very slow as its deployed on a free service that spins down on inactivity

## Project Structure
- Backend
- Database
- frontend
- Webserver

## Running the Application

### Method 1 - Using Docker Containers (recommended)

`cd` to the root folder of the project and run `docker compose up`. <br>
Wait until a prompt from goserver that looks something like this: <br>
```
goserver  |  ┌───────────────────────────────────────────────────┐
goserver  |  │                   Fiber v2.49.2                   │
goserver  |  │               http://127.0.0.1:4000               │
goserver  |  │       (bound on host 0.0.0.0 and port 4000)       │
goserver  |  │                                                   │
goserver  |  │ Handlers ............ 56  Processes ........... 1 │
goserver  |  │ Prefork ....... Disabled  PID ................. 1 │
goserver  |  └───────────────────────────────────────────────────┘
```
This may take a couple seconds to appear as health checks are performed to ensure the containers start running in the correct order. <br>
Once the mentioned prompt appears, visit _http://localhost_ on your browser to view the application UI

### Method 2 - Locally

**For this method, please ensure that the `BASE_URL` mentioned in `/frontend/src/config.js` is `http://localhost:4000/api` and NOT `http://localhost/api`. <br>
The latter is for the previous method**

Run the following commands with respect to the project root folder, in order (**Requires Docker**)

1. `cd /Database; docker compose up`
1. `cd /Backend; go mod download; go build; ./zilla-backend`
1. `cd /frontend; npm install; npm start`

Now visit _http://localhost:3000_ to view the application UI


## Features

- Secure Authentication and Authorization using JWTs
- Basic Project Management utilities - tasks (issues), roles, groups, task board
- Role and Group based access to tasks (issues).
- Ability to create independent Groups and add them to an isolated project and to create custom Roles.
- Role and Group based access to tasks (issues) - view, create, edit and delete
- Ability to buik import Users and Tasks into a project
- Ability for users to disable (anonymizes the user and preserves data so the user can re-enable it back at a later time) and delete their account (permenantly deletes user-related data while preserving relations to other groups, projects and roles).

## Technical Features
- Backend - Golang (gofiber framework)
- Frontend - ReactJS (SPA), Tailwind.css
- Webserver (reverse-proxy) - Nginx

## Application Preview

### Profile with account disabling / deleting
![image](https://github.com/BalkanID-University/ssn-chennai-2023-fte-hiring-RollingRocky360/assets/93033547/0e59deb6-c086-4d66-84db-f629a6fa622c)
![image](https://github.com/BalkanID-University/ssn-chennai-2023-fte-hiring-RollingRocky360/assets/93033547/5f827779-b71c-4369-87db-0721f6e790f1)

### Projects Dashboard
![image](https://github.com/BalkanID-University/ssn-chennai-2023-fte-hiring-RollingRocky360/assets/93033547/dd208d61-e73c-4e3d-89e1-f11565f4c92c)

### Project View

#### Project Members (people), Add individually / upload in bulk (owner only)*
<img width="960" alt="image" src="https://github.com/BalkanID-University/ssn-chennai-2023-fte-hiring-RollingRocky360/assets/93033547/368213da-b49b-4cab-af62-72f22a7ce463">
<img width="960" alt="image" src="https://github.com/BalkanID-University/ssn-chennai-2023-fte-hiring-RollingRocky360/assets/93033547/273b1e12-693e-4c56-bcbf-61185a48f4b5">
<img width="960" alt="image" src="https://github.com/BalkanID-University/ssn-chennai-2023-fte-hiring-RollingRocky360/assets/93033547/93c0e64d-daf9-4a7d-ad9d-ac478a1ae07a">

#### Create custom roles (owner only)(Roles - owner, lead, dev exist by default on a project)
<img width="960" alt="image" src="https://github.com/BalkanID-University/ssn-chennai-2023-fte-hiring-RollingRocky360/assets/93033547/54e3004a-5394-4555-b050-1745b4a0f71e">
<img width="960" alt="image" src="https://github.com/BalkanID-University/ssn-chennai-2023-fte-hiring-RollingRocky360/assets/93033547/11310151-bb7c-433c-ba9f-e2c83cd1d67d">


#### Assign Roles (owner only)
<img width="957" alt="image" src="https://github.com/BalkanID-University/ssn-chennai-2023-fte-hiring-RollingRocky360/assets/93033547/55cdea50-cf64-4f30-9d88-d891f4315ae0">

#### Create / Upload issues (any role with required permissions)*
<img width="960" alt="image" src="https://github.com/BalkanID-University/ssn-chennai-2023-fte-hiring-RollingRocky360/assets/93033547/d420f9d7-4a6f-4c17-8e53-2bef8c06a9cb">
![image](https://github.com/BalkanID-University/ssn-chennai-2023-fte-hiring-RollingRocky360/assets/93033547/2eb2e5e9-f0e7-48f7-9f38-84f247c0b499)
<img width="960" alt="image" src="https://github.com/BalkanID-University/ssn-chennai-2023-fte-hiring-RollingRocky360/assets/93033547/a9b23a3a-75e1-48fd-8414-c48b065976e9">

#### Manage your issues using the Issue Board (only the assignee can move them across columns)
<img width="960" alt="image" src="https://github.com/BalkanID-University/ssn-chennai-2023-fte-hiring-RollingRocky360/assets/93033547/04e630df-3ea1-4a43-a0c0-be60f3942281">


### Accept / Reject invitations
<img width="651" alt="image" src="https://github.com/BalkanID-University/ssn-chennai-2023-fte-hiring-RollingRocky360/assets/93033547/97094c1d-5910-42b9-9b0e-d6387cd7c4a6">

### Create / add independent groups
<img width="960" alt="image" src="https://github.com/BalkanID-University/ssn-chennai-2023-fte-hiring-RollingRocky360/assets/93033547/163de523-00de-4542-8761-f07346e10f29">

#### Add independent groups to projects and assign them a role in a single action
<img width="960" alt="image" src="https://github.com/BalkanID-University/ssn-chennai-2023-fte-hiring-RollingRocky360/assets/93033547/0b3a9e08-a27c-4ef0-811f-cb09e0915f9c">

##### *users mentioned in the csv file must have already been registered on the application. you can use a REST client like Postman to POST user data to the `/api/register` endpoint in JSON format, to register one user at a time. Samples for the JSON format and other CSV files are available in the `/UserSamples` folder







