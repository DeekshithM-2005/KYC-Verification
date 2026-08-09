const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/decentralized-kyc').then(async () => {
  const KYCDoc = mongoose.connection.collection('kycdocuments');
  await KYCDoc.updateOne(
    { userId: new mongoose.Types.ObjectId('6a705a89a688af0ea60cafce') },
    { $set: { ivHex: '00000000000000000000000000000000' } }
  );
  console.log('Tampered with IV in database!');
  process.exit(0);
});
