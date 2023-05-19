import * as Location from 'expo-location';
import { StatusBar } from "expo-status-bar";
import React, {useEffect, useState} from "react";
import { View, Text, Dimensions, StyleSheet, ScrollView } from 'react-native';

const {width:SCREEN_WIDTH} = Dimensions.get("window");
//console.log(SCREEN_WIDTH);

// api key
const serviceKey = 'DHAcdCIG92vecEcQDukq%2B%2Fn8eWJtPZ9jKZ3isc%2FWrsnaFK1ZMGLQraTGzmMhDIQLj%2FZCUSkvmj1BgKChWFkbjw%3D%3D';

// 위도, 경도 -> x, y 좌표 
const NX = 149;            // X축 격자점 수
const NY = 253;            // Y축 격자점 수

const Re = 6371.00877;     //  지도반경
const grid = 5.0;          //  격자간격 (km)
const slat1 = 30.0;        //  표준위도 1
const slat2 = 60.0;        //  표준위도 2
const olon = 126.0;        //  기준점 경도
const olat = 38.0;         //  기준점 위도
const xo = 210 / grid;     //  기준점 X좌표
const yo = 675 / grid;     //  기준점 Y좌표
let first = 0;

let PI;
let DEGRAD;
let RADDEG;
let re;
let sf;
let sn;
let ro;

if (first === 0) {
  PI = Math.asin(1.0) * 2.0;
  DEGRAD = PI / 180.0;
  RADDEG = 180.0 / PI;

  re = Re / grid;
  sf = Math.tan(PI * 0.25 + slat1 * 0.5);
  sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
  sn = Math.tan(PI * 0.25 + slat2 * 0.5) / Math.tan(PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  ro = Math.tan(PI * 0.25 + olat * 0.5);
  ro = re * sf / Math.pow(ro, sn);

  first = 1;
}

function mapToGrid(lat, lon, code = 0) {
  const ra = Math.tan(PI * 0.25 + lat * DEGRAD * 0.5);
  const raPow = re * sf / Math.pow(ra, sn);
  const theta = lon * DEGRAD - olon;
  console.log(raPow);

  let x = raPow * Math.sin(theta) + xo;
  let y = ro - raPow * Math.cos(theta) + yo;
  x = parseInt(x + 1.5);
  y = parseInt(y + 1.5);
  return [x, y];
}

export default function App() {
   const [city, setCity]=useState("Loading...");
  //const [location, setLocation] = useState();
  const [days, setDays]=useState([]);
  const [ok, setOk] = useState(true);
  const getWeather = async () => {
    const {granted} = await Location.requestForegroundPermissionsAsync();
    if(!granted){
      setOk(false);
    }
    const {coords:{latitude, longitude}} = await Location.getCurrentPositionAsync({accuracy:5});

    // const location = await Location.reverseGeocodeAsync(
    //   {latitude,longitude}, 
    //   {useGoogleMaps:false}
    // );
    // setCity(location[0].city);


    
    const numOfRows = 60;
    const pageNo = 1;

    // Get the current date and time
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    var hours = currentDate.getHours().toString().padStart(2, '0');
    var minutes = currentDate.getMinutes().toString().padStart(2, '0');

    // 매 시각 30분에 api 생성되기 때문에 현재 시각에서 30분 빼줌
    if (parseInt(minutes) < 30)
    {
      if (hours == '00')
      {
        hours = '23';
      }
      else
      {
        hours = parseInt(hours)-1;
        hours=hours.toString().padStart(2,'0');
      }
      minutes = (60-(30-parseInt(minutes))).toString();
    }

    const base_date = `${year}${month}${day}`;
    const base_time = `${hours}${minutes}`;

    // const nx = 55;
    // const ny = 127;
    console.log(latitude,longitude);
    const [nx, ny] = mapToGrid(latitude,longitude);
    console.log(nx,ny);

    const url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=${serviceKey}&numOfRows=${numOfRows}&pageNo=${pageNo}&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}&dataType=json`;
    // console.log(url)
    console.log({longitude});

    var items=[];
    const response = await fetch(url);
    const json = await response.json(); // 응답을 JSON 형태로 파싱
    items = await json.response.body.items.item;
    console.log(items);

  };

  useEffect(() => {
    getWeather();
  }, []);


  return (
    <View style={styles.container}>
      <StatusBar style="light"></StatusBar>
      <View style={styles.city}>
        <Text style={styles.cityName}>{city}</Text>
      </View>
      <ScrollView
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        horizontal 
        contentContainerStyle={styles.weather}
      >
        <View style={styles.day}>
          <Text style={styles.temp}>27</Text>
          <Text style={styles.description}>Sunny</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>27</Text>
          <Text style={styles.description}>Sunny</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>27</Text>
          <Text style={styles.description}>Sunny</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>27</Text>
          <Text style={styles.description}>Sunny</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>27</Text>
          <Text style={styles.description}>Sunny</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>27</Text>
          <Text style={styles.description}>Sunny</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1, 
    backgroundColor:"green"
  },
  city:{
    flex:1,
    //backgroundColor:"blue",
    justifyContent:"center",
    alignItems:"center"
  },
  cityName:{
    fontSize:60,
    fontWeight:"500"
  },
  weather:{
    //flex:3,
    //backgroundColor:"blue"
  },
  day:{
    width:SCREEN_WIDTH,
    //flex:1,
    //backgroundColor:"teal",
    alignItems:"center"
  },
  temp:{
    marginTop:30,
    fontSize:158,
  },
  description:{
    fontSize:70,
  }
})
 