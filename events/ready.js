export default {
    name: "ready",
    execute(client) {
        console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
    }
};
