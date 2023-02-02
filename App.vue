<script>
const getTestData = async () => {
  const filename = "message";
  console.log(await import(`./data/something/${filename}.json`));
  console.log(await import(`./data/whatever/${filename}.json`));
};

getTestData();
export default {};
</script>

<template>
  <div class="whatever">
    {{ new Date() }}
  </div>
</template>
