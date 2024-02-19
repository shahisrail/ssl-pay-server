const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const SSLCommerzPayment = require("sslcommerz-lts");
const cors = require("cors"); // Import cors module
require("dotenv").config();
app.use(cors());
app.use(express.json());

// // pM2AuYDHIb0Cafm2
// // Payment

const port = process.env.PORT || 5000;

const uri =
  "mongodb+srv://Payment:pM2AuYDHIb0Cafm2@cluster0.bkdyuro.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const store_id = "bdqui65ac0e9331f13";
const store_passwd = "bdqui65ac0e9331f13@ssl";
const is_live = false; //true for live, false for sandbox
const tran_id = new ObjectId().toString();

async function run() {
  try {
    const orderCollectoin = client.db("SSlPay").collection("order");
    app.post("/order", async (req, res) => {
      const data = {
        total_amount: 100,
        currency: "BDT",
        tran_id: tran_id, // use unique tran_id for each api call
        success_url: `http://localhost:5000/payment/succsess/${tran_id}`,
        fail_url: `http://localhost:5000/payment/fail/${tran_id}`,
        cancel_url: "http://localhost:3030/cancel",
        ipn_url: "http://localhost:3030/ipn",
        shipping_method: "Courier",
        product_name: "Computer.",
        product_category: "Electronic",
        product_profile: "general",
        cus_name: "Customer Name",
        cus_email: "customer@example.com",
        cus_add1: "Dhaka",
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: "01711111111",
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };
      console.log(data);
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then((apiResponse) => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: GatewayPageURL });
        const finalOrder = {
          paidStatus: false,
          tranjactionId: tran_id,
        };
        const result = orderCollectoin.insertOne(finalOrder);
        console.log("Redirecting to: ", GatewayPageURL);
      });
    });
    app.post("/payment/succsess/:tranID", async (req, res) => {
      console.log(req.params.tranID);
      const result = await orderCollectoin.updateOne(
        { tranjactionId: req.params.tranID },
        {
          $set: {
            paidStatus: true,
          },
        }
      );
      if (result.modifiedCount > 0) {
        res.redirect(
          `http://localhost:5173/payment/succsess/${req.params.tranID}`
        );
      }
    });
    app.post("/payment/fail/:tranID", async (req, res) => {
      const result = await orderCollectoin.deleteOne({
        tranjactionId: req.params.tranID,
      });
      if (result.deletedCount) {
        res.redirect(
          `http://localhost:5173/payment/fail/${req.params.tranID}`
        );
      }
    });
  } finally {
    // Ensure that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("ssl payment getway ruuning");
});
