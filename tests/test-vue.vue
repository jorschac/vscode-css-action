<template>
	<div class="contentWrapper">
	  <div class="logo">
		<span>Logo</span>
	  </div>
	  <p>Some content here</p>
	</div>
  </template>
  
  <script>
  export default {
	name: 'MyComponent',
  }
  </script>
  
  <style lang="scss" scoped>
  @mixin flex-center {
	display: flex;
	justify-content: center;
	align-items: center;
	border-color: hsl(0, 100%, 50%);
  }
  
  .contentWrapper {
	@include flex-center;
	flex-direction: column;
	background-color: rgb(6, 27, 38);
  
	.logo {
	  @include flex-center;
	  justify-content: space-around;
	}
  }
  </style>