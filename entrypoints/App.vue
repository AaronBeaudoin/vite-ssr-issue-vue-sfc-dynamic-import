<script>
const asyncWrapper = async () => {
  const name = "test";
  console.log("[dynamicA/test.json#message]", (await import(`./dynamicA/${name}.json`)).default.message);
  console.log("[dynamicB/test.json#message]", (await import(`./dynamicB/${name}.json`)).default.message);
};

asyncWrapper();
export default {};
</script>

<template>
  <div class="whatever">
    {{ new Date() }}
  </div>
</template>
