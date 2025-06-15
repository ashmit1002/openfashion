"use client";
import axios from "axios";

const baseApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL + "/api",
})

export default baseApi;
