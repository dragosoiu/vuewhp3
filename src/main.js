import Vue from "vue";
import App from "./App.vue";
import VueRouter from 'vue-router';
import axios from 'axios'
import VueAxios from 'vue-axios'
import Vuex from 'vuex'
import VueApollo from 'vue-apollo'
import ApolloClient from 'apollo-boost'
import gql from "graphql-tag";


import Podcasts from "./components/Podcasts";
import Podcast from "./components/Podcast";
import About from "./components/About";


Vue.config.productionTip = false;

Vue.use(VueRouter);

Vue.use(VueAxios, axios);

Vue.use(Vuex);


const apolloClient = new ApolloClient({
  uri: 'https://jsnoise.herokuapp.com/graphql'
});

Vue.use(VueApollo)

const apolloProvider = new VueApollo({
  defaultClient: apolloClient,
})



var store = new Vuex.Store({
  state: {
      first: false,
      last: false,
      page: 1,
      podcasts: [],
      podcast: null
  },
  mutations: {
      LOAD_PODCASTS(state , data) {     
      state.podcasts = data.shows;
      state.first = data.first;
      state.last = data.last;
      },
      LOAD_PODCAST(state, data) {
          state.podcast = data;
      }  
  },
  actions: {
      loadPodcastsREST({ commit, state }) {
          axios
          .get(`https://jsnoise.herokuapp.com/api/showslist?page=${state.page}`)
          .then(response => {
              console.log("vuex podcasts:", { data: response.data });
              commit("LOAD_PODCASTS", response.data);
          })
          .catch(err => console.dir(err));
      },
      loadPodcastREST({ commit }, showId) {
        axios
            .get(`https://jsnoise.herokuapp.com/api/shows/${showId}`)
            .then(response => {
            console.log("vuex podcast:", { data: response.data });
            commit("LOAD_PODCAST", response.data);
            })
            .catch(err => console.dir(err));
        },
      loadPodcasts({ commit, state }) {
        apolloClient
            .query({
            query: gql`
                query shows($page: Int) {
                showsList(page: $page) {
                    first
                    last
                    shows {
                    id
                    title
                    mp3
                    publishedDate
                    producerName
                    producerId
                    }
                }
                }
            `,
            variables: { page: state.page }
            })
            .then(response => {
            commit("LOAD_PODCASTS", response.data.showsList);
            })
            .catch(err => console.dir("gql err: ", err));
    },
    loadPodcast({ commit, state }, showId) {
      apolloClient
          .query({
          query: gql`
              query oneShow($id: Int!) {
              show(id: $id) {
                  id
                  title
                  mp3
                  description
                  producerName
                  publishedDate
              }
              }
          `,
          variables: { id: showId }
          })
          .then(response => {
          commit("LOAD_PODCAST", response.data.show);
          })
          .catch(err => console.dir("gql err: ", err));
      },
      prevPage({commit, state,dispatch}) {
          if (state.first === true) return;
          state.page--;
          dispatch("loadPodcasts");
      },
      nextPage({commit, state,dispatch}) {
          if (state.last === true) return;
          state.page++;
          dispatch("loadPodcasts");
      }
    
      }
  });


Vue.filter('formatDate', function(dt){
  if (dt && dt.indexOf("T")>=0) return dt.split("T")[0]
});

let router = new VueRouter({
  mode: "history",
  routes: [
      { path: "/", component: Podcasts },
      { path: "/podcasts", component: Podcasts },
      { path: "/about", component: About },
      { path: "/:id", component: Podcast },
      { path: "*", component: Podcasts }
  ]
  });

new Vue({
  router,
  store,
  apolloProvider,
  render: h => h(App)
}).$mount("#app");
