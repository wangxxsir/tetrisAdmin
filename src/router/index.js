import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("../views/home.vue"),
  },{
    path:"/tetris",
    name:"Tetris",
    component: () => import("../views/tetris.vue")
  }
];
const router = createRouter({
  history: createWebHistory(),
  routes,
})
export default router;