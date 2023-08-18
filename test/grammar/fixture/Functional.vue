<template functional>
  <div class="html">
    <div class="vue-directive" v-if="test"></div>
    <div class="vue-directive-2" :attr="test()"></div>
    <div class="vue-interpolation">{{test.case()}}</div>
    <div class="single-quote" v-if='test'></div>
  </div>
</template>
