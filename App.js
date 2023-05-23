import * as Location from 'expo-location';
import { StatusBar } from "expo-status-bar";
import React, {useEffect, useState} from "react";
import { View, Text, Dimensions, StyleSheet, ScrollView } from 'react-native';

const {width:SCREEN_WIDTH} = Dimensions.get("window");
//console.log(SCREEN_WIDTH);

// api key
const serviceKey = 'DHAcdCIG92vecEcQDukq%2B%2Fn8eWJtPZ9jKZ3isc%2FWrsnaFK1ZMGLQraTGzmMhDIQLj%2FZCUSkvmj1BgKChWFkbjw%3D%3D';

// 현재 시각에서 1시간 빼주기 위한 함수
var modifyTime = function(hours,day)
{
  if (hours == '00')
  {
    hours = '23';
    var now = new Date();
    day = now.getDate(now.setDate(now.getDate()-1)).toString().padStart(2,'0'); // 어제 날짜
  }
  else
  {
    hours = parseInt(hours)-1;
    hours=hours.toString().padStart(2,'0');
  }
  return [hours,day];
}

// 위도, 경도 -> x,y 좌표
var RE = 6371.00877; // 지구 반경(km)
var GRID = 5.0; // 격자 간격(km)
var SLAT1 = 30.0; // 투영 위도1(degree)
var SLAT2 = 60.0; // 투영 위도2(degree)
var OLON = 126.0; // 기준점 경도(degree)
var OLAT = 38.0; // 기준점 위도(degree)
var XO = 43; // 기준점 X좌표(GRID)
var YO = 136; // 기준점 Y좌표(GRID)    

// LCC DFS 좌표변환 ( code : "toXY"(위경도->좌표, v1:위도, v2:경도), "toLL"(좌표->위경도,v1:x, v2:y) )
function dfs_xy_conv(code, v1, v2) {
    var DEGRAD = Math.PI / 180.0;
    var RADDEG = 180.0 / Math.PI;

    var re = RE / GRID;
    var slat1 = SLAT1 * DEGRAD;
    var slat2 = SLAT2 * DEGRAD;
    var olon = OLON * DEGRAD;
    var olat = OLAT * DEGRAD;

    var sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    var sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
    var ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);
    var rs = {};
    if (code == "toXY") {
        rs['lat'] = v1;
        rs['lng'] = v2;
        var ra = Math.tan(Math.PI * 0.25 + (v1) * DEGRAD * 0.5);
        ra = re * sf / Math.pow(ra, sn);
        var theta = v2 * DEGRAD - olon;
        if (theta > Math.PI) theta -= 2.0 * Math.PI;
        if (theta < -Math.PI) theta += 2.0 * Math.PI;
        theta *= sn;
        rs['x'] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
        rs['y'] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
    }
    else {
        rs['x'] = v1;
        rs['y'] = v2;
        var xn = v1 - XO;
        var yn = ro - v2 + YO;
        ra = Math.sqrt(xn * xn + yn * yn);
        if (sn < 0.0) - ra;
        var alat = Math.pow((re * sf / ra), (1.0 / sn));
        alat = 2.0 * Math.atan(alat) - Math.PI * 0.5;

        if (Math.abs(xn) <= 0.0) {
            theta = 0.0;
        }
        else {
            if (Math.abs(yn) <= 0.0) {
                theta = Math.PI * 0.5;
                if (xn < 0.0) - theta;
            }
            else theta = Math.atan2(xn, yn);
        }
        var alon = theta / sn + olon;
        rs['lat'] = alat * RADDEG;
        rs['lng'] = alon * RADDEG;
    }
    return rs;
}

// 날씨(현재 시간) 예보 코드 -> 값
// 초단기예보 api
function extractUltraSrtWeather(json){
  const items = json.response.body.items.item;
  const currentTime=items[0]["fcstTime"]; // 현재 시간(hour)
  // console.log(currentTime);
  let weatherInfo = {}; 
  items.forEach((dic)=>{
    if (dic["fcstTime"]==currentTime){
      switch(dic["category"]){
        case "T1H": // 기온
          weatherInfo.temperature = dic["fcstValue"];
          break;
        case "SKY": // 하늘 상태
          weatherInfo.sky =dic["fcstValue"];
          break;
        case "WSD": // 풍속
          weatherInfo.wind = dic["fcstValue"];
          break;
        case "PTY": // 강수형태
          weatherInfo.rainOrsnow = dic["fcstValue"];
          break;
        case "RN1" : // 강수량
          weatherInfo.rainfall = dic["fcstValue"];
          break;
      }
    }
  });
  return weatherInfo;
};

// 날씨(현재 시간) 예보 코드 -> 값
// 단기예보 api
function extractVilageWeather(json){
  const items = json.response.body.items.item;
  let weatherInfo = {}; 
  items.forEach((dic)=>{
    if (dic["category"]=='TMN'){ // 최저 기온
      weatherInfo.lowerTmp=dic["fcstValue"];
    }
    if (dic["category"]=='TMX'){ //최고 기온
      weatherInfo.upperTmp=dic["fcstValue"];
    }
  });
  console.log(weatherInfo);
  return weatherInfo;
};

function commentWeather(weatherDict,apiType){
  let commentDict={};
  if (apiType=="ultraSrt"){
    commentDict.temperature=weatherDict.temperature+"도";
    commentDict.wind=weatherDict.wind+"m/s";
    if (weatherDict.rainfall == "강수없음"){
      commentDict.rainfall=weatherDict.rainfall;
    }
    else{
      commentDict.rainfall=weatherDict.rainfall+"mm";
    }
    
    switch(weatherDict.sky){
      case "1":
        commentDict.sky="맑음";
        break;
      case "3":
        commentDict.sky="구름많음";
        break;
      case "4":
        commentDict.sky="흐림";
        break;
    }
    switch(weatherDict.rainOrsnow){
      case "0":
        commentDict.rainOrsnow="없음";
        break;
      case "1":
        commentDict.rainOrsnow="비";
        break;
      case "2":
        commentDict.rainOrsnow="비/눈";
        break;
      case "3":
        commentDict.rainOrsnow="눈";
        break;
      case "5":
        commentDict.rainOrsnow="빗방울";
        break;
      case "6":
        commentDict.rainOrsnow="빗방울눈날림";
        break;
      case "7":
        commentDict.rainOrsnow="눈날림";
        break;
    }   
  }
  return commentDict; 
}

// 초단기예보 api
function getCurrnetWeatherUrl(latitude, longitude){
  // const numOfRows = 60;
  // const pageNo = 1;

  // Get the current date and time
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  var day = currentDate.getDate().toString().padStart(2, '0');
  var hours = currentDate.getHours().toString().padStart(2, '0');
  var minutes = currentDate.getMinutes().toString().padStart(2, '0');

  const modifiedTime = modifyTime(hours,day);
  hours=modifiedTime[0];
  day=modifiedTime[1];

  const base_date = `${year}${month}${day}`;
  const base_time = `${hours}${minutes}`;

  var rs = dfs_xy_conv("toXY",latitude.toString(),longitude.toString());
  // console.log(rs.x, rs.y);
  const nx = rs.x;
  const ny = rs.y;
  
  return [`http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=${serviceKey}&numOfRows=60&pageNo=1&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}&dataType=json`,
          `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${serviceKey}&numOfRows=254&pageNo=1&base_date=${base_date}&base_time=0200&nx=${nx}&ny=${ny}&dataType=json`];
}


export default function App() {
  const [city, setCity]=useState("Loading...");
  const [subregion, setSubregion]=useState("Loading...");
  const [district, setDistrict]=useState();
  const [TEMP, setTemp]=useState();
  const [SKY, setSky]=useState();
  const [lowerTEMP, setLowerTemp]=useState();
  const [upperTEMP, setUpperTemp]=useState();
  
  // const [location, setLocation] = useState();
  // const [days, setDays]=useState([]);
  const [ok, setOk] = useState(true);

  // 현재(위치, 시간) 날씨
  const getWeather = async () => {
    const {granted} = await Location.requestForegroundPermissionsAsync();
    if(!granted){
      setOk(false);
    }
    const {coords:{latitude, longitude}} = await Location.getCurrentPositionAsync({accuracy:5});
    

    const location = await Location.reverseGeocodeAsync(
      {latitude,longitude}, 
      {useGoogleMaps:false}
    );
    setCity(location[0].city); // ex) 제주시
    setDistrict(location[0].district); // ex) 일도이동
    setSubregion(location[0].subregion); // ex) 봉화군

    // 초단기 예보 api url
    const ultraSrtUrl = getCurrnetWeatherUrl(latitude, longitude)[0];
    // console.log(url);
    
    const ultraSrtResponse = await fetch(ultraSrtUrl);
    const ultraSrtjson = await ultraSrtResponse.json(); // 응답을 JSON 형태로 파싱
    ultraSrtWeatherInfo=extractUltraSrtWeather(ultraSrtjson);
    console.log("초단기 예보 : ",commentWeather(ultraSrtWeatherInfo,"ultraSrt"));
    // JSON.stringify() : 객체를 직접적으로 React 자식 요소로 사용할 수 없기 때문에 객체를 문자열로 변환
    // .replace(/\"/gi, "") : 따옴표 제거
    setTemp(JSON.stringify(commentWeather(ultraSrtWeatherInfo,"ultraSrt").temperature).replace(/\"/gi, ""));
    setSky(JSON.stringify(commentWeather(ultraSrtWeatherInfo,"ultraSrt").sky).replace(/\"/gi, "")); 
    

    // 단기 예보 api url
    const vilageUrl = getCurrnetWeatherUrl(latitude, longitude)[1];
    console.log(vilageUrl);
    const vilageResponse = await fetch(vilageUrl);
    const vilageJson = await vilageResponse.json(); // 응답을 JSON 형태로 파싱
    vilageWeatherInfo=extractVilageWeather(vilageJson);
    console.log("단기 예보 : ",(vilageWeatherInfo));

    setLowerTemp(JSON.stringify(vilageWeatherInfo.lowerTmp).replace(/\"/gi, ""));
    setUpperTemp(JSON.stringify(vilageWeatherInfo.upperTmp).replace(/\"/gi, "")); 
  };

  // 날씨 비교 분석
  const compareWeather = async () => {
    const testUrl = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=DHAcdCIG92vecEcQDukq%2B%2Fn8eWJtPZ9jKZ3isc%2FWrsnaFK1ZMGLQraTGzmMhDIQLj%2FZCUSkvmj1BgKChWFkbjw%3D%3D&numOfRows=60&pageNo=1&base_date=20230523&base_time=1251&nx=60&ny=127&dataType=json`;
    const compareResponse = await fetch(testUrl);
    const compareJson = await compareResponse.json();
    compareInfo=extractUltraSrtWeather(compareJson);
    console.log("검색 지역 : ", commentWeather(compareInfo,"ultraSrt"));

    

    

  };

  useEffect(() => {
    getWeather();
    compareWeather();
  }, []);


  return (
    <View style={styles.container}>
      <StatusBar style="light"></StatusBar>
      <View style={styles.city}>
        <Text style={styles.cityName}>{city} {subregion} {district}</Text>
      </View>
      <ScrollView
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        horizontal 
        contentContainerStyle={styles.weather}
      >
        <View style={styles.day}>
          <Text style={styles.temp}>{TEMP}</Text>
          <Text style={styles.description}>{SKY}</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>{lowerTEMP}</Text>
          <Text style={styles.description}>{upperTEMP}</Text>
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
    fontSize:100,
  },
  description:{
    fontSize:70,
  }
})
