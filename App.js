import * as Location from 'expo-location';
import { StatusBar } from "expo-status-bar";
import React, {useEffect, useState} from "react";
import { View, Text, Dimensions, StyleSheet, ScrollView, TextInput, Button } from 'react-native';
import {
  LineChart,
} from "react-native-chart-kit";



// const {width:SCREEN_WIDTH} = Dimensions.get("window");
//console.log(SCREEN_WIDTH);

// api key
const serviceKey = 'DHAcdCIG92vecEcQDukq%2B%2Fn8eWJtPZ9jKZ3isc%2FWrsnaFK1ZMGLQraTGzmMhDIQLj%2FZCUSkvmj1BgKChWFkbjw%3D%3D';
                    
const locationJson = require('./data.json');



// const location = searchLocation("청운효자동");
// if (location) {
//   const { latitude, longitude } = location;
//   console.log("위도:", latitude);
//   console.log("경도:", longitude);
// } else {
//   console.log("지역을 찾을 수 없습니다.");
// }

// 초단기예보 : 현재 시각에서 1시간 빼줌 (예외처리 : 23시)
// 단기예보 : 어제 날짜, 23시로 지정
var modifyTime = function(hours,day,apiType) 
{
  if (hours == '00' || apiType=="vilage")
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

function modifyRegion(region){
  if (region.charAt(region.length - 1)=="시"){
    region=region.substr(0,2);
  }
  else if (region.charAt(region.length - 1)=="도"){
    console.log(region);
    switch (region){
      case "충청북도":
        region="충북";
        break;
      case "충청남도":
        region="충남";
        break;
      case "전라북도":
        region="전북";
        break;
      case "전라남도":
        region="전남";
        break;
      case "경상북도":
        region="경북";
        break;
      case "경상남도":
        region="경남";
        break;
      default:
        region=region.substr(0,2);
    }
  }
  return region;
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

// 미세먼지 api : xml 파싱
function parseXml(xml) {
  var parseString=require('react-native-xml2js').parseString;
  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
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
        case "REH" : // 습도
          weatherInfo.humidity=dic["fcstValue"];
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
  let tmpfortime = {}; 
  let windfortime = {}; 
  let rainfortime = {};
  let humidityfortime = {};
  items.forEach((dic)=>{
    if (dic["category"]=='TMN'){ // 최저 기온
      weatherInfo.lowerTmp=dic["fcstValue"];
    }
    if (dic["category"]=='TMX'){ //최고 기온
      weatherInfo.upperTmp=dic["fcstValue"];
    }
    if (dic["category"]=='TMP'){
      switch (dic["fcstTime"]){
        case '0600':
          tmpfortime.tmp06=dic["fcstValue"];
          break;
        case '0900':
          tmpfortime.tmp09=dic["fcstValue"];
          break;
        case '1200':
          tmpfortime.tmp12=dic["fcstValue"];
          break;
        case '1500':
          tmpfortime.tmp15=dic["fcstValue"];
          break;
        case '1800':
          tmpfortime.tmp18=dic["fcstValue"];
          break;
        case '2100':
          tmpfortime.tmp21=dic["fcstValue"];
      }
    }
    if (dic["category"]=='WSD'){
      switch (dic["fcstTime"]){
        case '0600':
          windfortime.wind06=dic["fcstValue"];
          break;
        case '0900':
          windfortime.wind09=dic["fcstValue"];
          break;
        case '1200':
          windfortime.wind12=dic["fcstValue"];
          break;
        case '1500':
          windfortime.wind15=dic["fcstValue"];
          break;
        case '1800':
          windfortime.wind18=dic["fcstValue"];
          break;
        case '2100':
          windfortime.wind21=dic["fcstValue"];
      }
    }
    if (dic["category"]=='PCP'){
      if (dic["fcstValue"]=="강수없음"){
        dic["fcstValue"]="0.0mm"
      }
      switch (dic["fcstTime"]){
        case '0600':
          rainfortime.rain06=dic["fcstValue"];
          break;
        case '0900':
          rainfortime.rain09=dic["fcstValue"];
          break;
        case '1200':
          rainfortime.rain12=dic["fcstValue"];
          break;
        case '1500':
          rainfortime.rain15=dic["fcstValue"];
          break;
        case '1800':
          rainfortime.rain18=dic["fcstValue"];
          break;
        case '2100':
          rainfortime.rain21=dic["fcstValue"];
      }
    }
    if (dic["category"]=='REH'){
      switch (dic["fcstTime"]){
        case '0600':
          humidityfortime.humidity06=dic["fcstValue"];
          break;
        case '0900':
          humidityfortime.humidity09=dic["fcstValue"];
          break;
        case '1200':
          humidityfortime.humidity12=dic["fcstValue"];
          break;
        case '1500':
          humidityfortime.humidity15=dic["fcstValue"];
          break;
        case '1800':
          humidityfortime.humidity18=dic["fcstValue"];
          break;
        case '2100':
          humidityfortime.humidity21=dic["fcstValue"];
      }
    }
  });
  console.log("강수량 데이터 확인:",rainfortime);
  return [weatherInfo, tmpfortime, windfortime, rainfortime, humidityfortime];
};

function extractPm(grade){
  if (grade==1){
    return "좋음";
  }
  else if (grade==2){
    return "보통";
  }
  else if (grade==3){
    return "나쁨";
  }
  else if (grade==4){
    return "매우나쁨";
  }
}

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

// 초단기예보, 단기예보 api
function getCurrnetWeatherUrl(latitude, longitude, apiType){
  // const numOfRows = 60;
  // const pageNo = 1;

  // Get the current date and time
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  var day = currentDate.getDate().toString().padStart(2, '0');
  var hours = currentDate.getHours().toString().padStart(2, '0');
  var minutes = currentDate.getMinutes().toString().padStart(2, '0');

  var modifiedTime;
  if (apiType=="vilage"){
    modifiedTime = modifyTime(hours,day,"vilage");
  }
  else if (apiType=="ultraSrt"){
    modifiedTime = modifyTime(hours,day,"ultraSrt");
  }
  
  hours=modifiedTime[0];
  day=modifiedTime[1];

  const base_date = `${year}${month}${day}`;
  const base_time = `${hours}${minutes}`;

  var rs = dfs_xy_conv("toXY",latitude.toString(),longitude.toString());
  // console.log("x,y 확인",rs.x, rs.y);
  const nx = rs.x;
  const ny = rs.y;
  
  return [`http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=${serviceKey}&numOfRows=60&pageNo=1&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}&dataType=json`,
          `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${serviceKey}&numOfRows=290&pageNo=1&base_date=${base_date}&base_time=2300&nx=${nx}&ny=${ny}&dataType=json`];
}

function getCurrnetPmUrl(region){
  region=modifyRegion(region);
  return `http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?serviceKey=${serviceKey}&numOfRows=125&pageNo=1&sidoName=${region}&ver=1.0`;
}

function sensoryTemp(temp,humidity){
  console.log("기온,습도",temp,humidity);
  let Tw=temp*Math.atan(0.151977*Math.sqrt(humidity+8.313659)); //Tw(습구온도)
  Tw += Math.atan(temp+humidity);
  Tw -= Math.atan(humidity-1.67633);
  Tw += (0.00391838*Math.pow(humidity,1.5) * Math.atan(0.023101*humidity));
  Tw -= 4.686035;
  // Math.round(Number * 10^n) / 10^n
  let result=Math.round((-0.2442 + (0.55399*Tw) + (0.45535*temp) - (0.0022*Math.pow(Tw,2)) + (0.00278*Tw*temp) + 3.0) * 10 ) / 10; // 체감온도
  return result;
}



// var data = {
//   labels: ["6시", "9시", "12시", "15시", "18시", "21시"],
//   datasets : [
//     {
//       data: [10, 10, 10, 10, 10, 10],
//       color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // 첫 번째 데이터 세트의 색상
//       strokeWidth: 2 // 첫 번째 데이터 세트의 선 두께
//     },
//     {
//       data: [10, 35, 18, 70, 89, 33],
//       color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`, // 두 번째 데이터 세트의 색상
//       strokeWidth: 2 // 두 번째 데이터 세트의 선 두께
//     }
//   ],
//   legend: ["시간대별 기온 비교"] // optional
// };

function makeData(currentTmpForTime){
  const values = [];
  Object.values(currentTmpForTime).forEach(value => {
    values.push(parseInt(value));
  });
  // console.log(values);
  console.log("makeData 확인",typeof(values[0]));
  return values;
}

function makeSensoryData(tmpList,humidityList){
  const values = [];
  for(let i=0 ; i<tmpList.length ; i++){
    values.push(sensoryTemp(tmpList[i],humidityList[i]))
  }
  // console.log(values);
  // console.log("makeData 확인",typeof(values[0]));
  return values;
}


const {width:screenWidth} = Dimensions.get("window");

const chartConfig = {
  backgroundGradientFrom: "#1E2923",
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: "#08130D",
  backgroundGradientToOpacity: 0.5,
  color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
  strokeWidth: 2, // optional, default 3
  barPercentage: 0.5,
  useShadowColorFromDataset: false // optional
};

export default function App() {
  const [city, setCity]=useState("Loading...");
  const [subregion, setSubregion]=useState("Loading...");
  const [district, setDistrict]=useState();
  const [TEMP, setTemp]=useState();
  const [SKY, setSky]=useState();
  const [wind, setWind]=useState();
  const [rainfall, setRainfall]=useState();
  // const [humidity, setHumidity]=useState();
  const [sensoryTEMP, setSensoryTemp]=useState();
  const [lowerTEMP, setLowerTemp]=useState();
  const [upperTEMP, setUpperTemp]=useState();
  const [pmGrade10, setPmGrade10]=useState();
  const [pmGrade25, setPmGrade25]=useState();
  const [pmValue10, setPmValue10]=useState();
  const [pmValue25, setPmValue25]=useState();
  const [tempData, setTempData]=useState(null);
  const [windData, setWindData]=useState(null);
  const [rainData, setRainData]=useState(null);
  const [sensoryData, setSensoryData]=useState(null);
  
  const [vilageJson, setVilageJson]=useState();
  const [isLoading, setIsLoading] = useState(true);
  
  // 검색 기능을 위한.
  const [locationName, setLocationName] = useState('');
  const [searchLatitude, setLatitude] = useState('');
  const [searchLongitude, setLongitude] = useState('');
  
  // const [location, setLocation] = useState();
  // const [days, setDays]=useState([]);
  const [ok, setOk] = useState(true);

  // 검색 기능
  const searchLocation = () => {
    const result = locationJson.find(item => item['3단계'] === locationName);
    if (result) {
      const { '위도(초/100)': lat, '경도(초/100)': lon } = result;
      setLatitude(lat);
      setLongitude(lon);
      const searchUrl = getCurrnetWeatherUrl(searchLatitude, searchLongitude,"ultraSrt")[0];
      console.log("검색 지역 url",searchUrl);
    }
    else {
      setLatitude('');
      setLongitude('');
    }
  };
  
  // 현재(위치, 시간) 날씨
  const getWeather = async () => {
    // 승인 요청
    const {granted} = await Location.requestForegroundPermissionsAsync();
    if(!granted){
      setOk(false);
    }
    // 위도, 경도
    const {coords:{latitude, longitude}} = await Location.getCurrentPositionAsync({accuracy:5});
    

    const location = await Location.reverseGeocodeAsync(
      {latitude,longitude}, 
      {useGoogleMaps:false}
    );
    // console.log(location);
    var region=location[0].region; // 미세먼지 api 요청을 위한 변수. ex) 제주특별자치도, 경기도 ... 
    setCity(location[0].city); // ex) 제주시
    setDistrict(location[0].district); // ex) 일도이동
    setSubregion(location[0].subregion); // ex) 봉화군


    // 초단기 예보 api url
    const ultraSrtUrl = await getCurrnetWeatherUrl(latitude, longitude,"ultraSrt")[0];
    console.log(ultraSrtUrl);
    
    const ultraSrtResponse = await fetch(ultraSrtUrl);
    const ultraSrtjson = await ultraSrtResponse.json(); // 응답을 JSON 형태로 파싱
    console.log("check :", ultraSrtjson);
    ultraSrtWeatherInfo= extractUltraSrtWeather(ultraSrtjson);
    // setHumidity(ultraSrtWeatherInfo.humidity);
    setSensoryTemp(sensoryTemp(parseFloat(ultraSrtWeatherInfo.temperature),parseFloat(ultraSrtWeatherInfo.humidity)));
    setRainfall(ultraSrtWeatherInfo.rainfall);
    console.log("초단기 예보 : ",commentWeather(ultraSrtWeatherInfo,"ultraSrt"));
    // JSON.stringify() : 객체를 직접적으로 React 자식 요소로 사용할 수 없기 때문에 객체를 문자열로 변환
    // .replace(/\"/gi, "") : 따옴표 제거
    setTemp(JSON.stringify(commentWeather(ultraSrtWeatherInfo,"ultraSrt").temperature).replace(/\"/gi, "")); // 기온
    setSky(JSON.stringify(commentWeather(ultraSrtWeatherInfo,"ultraSrt").sky).replace(/\"/gi, "")); // 하늘 상태
    setWind(JSON.stringify(commentWeather(ultraSrtWeatherInfo,"ultraSrt").wind).replace(/\"/gi, "")); // 풍속
    
    

    // 단기 예보 api url
    const vilageUrl = getCurrnetWeatherUrl(latitude, longitude,"vilage")[1];
    console.log("단기예보 url",vilageUrl);
    const vilageResponse = await fetch(vilageUrl);
    const vilageJson = await vilageResponse.json(); // 응답을 JSON 형태로 파싱
    setVilageJson(vilageJson);
    // console.log("json1:",vilageJson);
    vilageWeatherInfo=extractVilageWeather(vilageJson)[0];
    

    console.log("단기 예보 check : ",(vilageWeatherInfo));

    setLowerTemp(JSON.stringify(vilageWeatherInfo.lowerTmp).replace(/\"/gi, ""));
    setUpperTemp(JSON.stringify(vilageWeatherInfo.upperTmp).replace(/\"/gi, ""));
    
    
    // const pmJson = await pmResponse.json(); // 응답을 JSON 형태로 파싱
    // pmInfo=extractPm(pmJson);
    // console.log("미세먼지 : ",(pmInfo));
    // url = 'http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty';
    // const pmResponse = await fetch(url, {
    //   method : "GET",
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     serviceKey : serviceKey,
    //     returnType : 'json',
    //     numOfRows : 125,
    //     pageNo: 1,
    //     sidoName : modifyRegion(region),
    //     ver: 1.0
    //   }),
    // })
    
    // 미세먼지 api url
    const pmUrl = getCurrnetPmUrl(region);
    console.log("pmurl",pmUrl);
    var pmResponse = await fetch(pmUrl);
    pmResponse=await pmResponse.text();

    try {
      var parseResult = await parseXml(pmResponse);
      var pmGradeSum10=0; // 미세먼지 등급
      var pmGradeSum25 = 0; // 초미세먼지 등급
      var pmValueSum10=0; // 미세먼지 농도
      var pmValueSum25=0; // 초미세먼지 농도
      var countGrade10=0;
      var countGrade25 = 0;
      var countValue10=0;
      var countValue25=0;
      const items = parseResult.response.body[0].items[0].item;
      for (const item of items) {
        const pm10Grade = parseInt(item.pm10Grade[0]);
        const pm25Grade = parseInt(item.pm25Grade[0]);
        const pm10Value = parseInt(item.pm10Value[0]);
        const pm25Value = parseInt(item.pm25Value[0]);
        if (!isNaN(pm10Grade)) {
          pmGradeSum10 += pm10Grade;
          countGrade10 += 1;
        }
        if (!isNaN(pm25Grade)) {
          pmGradeSum25 += pm25Grade;
          countGrade25 += 1;
        }
        if (!isNaN(pm10Value)) {
          pmValueSum10 += pm10Value;
          countValue10 += 1;
        }
        if (!isNaN(pm25Value)) {
          pmValueSum25 += pm25Value;
          countValue25 += 1;
        }
        // console.log("pm10Grade:", pm10Grade);
      }
      setPmGrade10(extractPm(Math.round(pmGradeSum10 / countGrade10)));
      setPmGrade25(extractPm(Math.round(pmGradeSum25 / countGrade25)));
      setPmValue10(Math.round(pmValueSum10 / countValue10));
      setPmValue25(Math.round(pmValueSum25 / countValue25));
      console.log("미세먼지 농도: ",pmValue10);
    } catch (err) {
      console.log("Error:", err); // console에 'Error: [TypeError: Cannot read property 'body' of undefined]' 이렇게 떠도 앱에는 잘 출력됨(왜..?)
    }
    
    

//     const pmUrl = getCurrnetPmUrl(region);
//     fetch(pmUrl)
//     .then(function(response) {
//         return response.json();
//     })
//     .then(function(json) {
//         console.log(json);
//         return json
//     })
// console.log(1);
// console.log(2);

  };

  // 날씨 비교 분석
  const compareWeather = async () => {
    if (!vilageJson) {
      // vilageJson이 업데이트되지 않은 경우, 잠시 후에 다시 호출
      setTimeout(compareWeather, 1000); // 1초 후에 compareWeather 함수 호출
      return;
    }
    const testUrl = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=DHAcdCIG92vecEcQDukq%2B%2Fn8eWJtPZ9jKZ3isc%2FWrsnaFK1ZMGLQraTGzmMhDIQLj%2FZCUSkvmj1BgKChWFkbjw%3D%3D&numOfRows=60&pageNo=1&base_date=20230529&base_time=1400&nx=60&ny=127&dataType=json`;
    const testUrl2 = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=DHAcdCIG92vecEcQDukq%2B%2Fn8eWJtPZ9jKZ3isc%2FWrsnaFK1ZMGLQraTGzmMhDIQLj%2FZCUSkvmj1BgKChWFkbjw%3D%3D&numOfRows=290&pageNo=1&base_date=20230528&base_time=2300&nx=60&ny=127&dataType=json`;
    const compareResponse = await fetch(testUrl);
    const compareJson = await compareResponse.json();
    const searchResponse = await fetch(testUrl2);
    const searchJson = await searchResponse.json();

    // 검색 지역 초단기예보
    compareInfo=extractUltraSrtWeather(compareJson); 
    console.log("검색 지역 : ", commentWeather(compareInfo,"ultraSrt"));

    // getWeather에서 생성한 vilageJson 사용
    // 6,9,12,15,18,21시 기온
    currentTmpForTime=extractVilageWeather(vilageJson)[1]; 
    searchTmpForTime=extractVilageWeather(searchJson)[1];
    const currentTmpList=makeData(currentTmpForTime);
    const searchTmpList=makeData(searchTmpForTime);
    //console.log("검색 지역 기온 : ", searchTmpForTime);

    // 6,9,12,15,18,21시 풍속
    currentWindForTime=extractVilageWeather(vilageJson)[2]; 
    searchWindForTime=extractVilageWeather(searchJson)[2];

    // 6,9,12,15,18,21시 강수량
    currentRainForTime=extractVilageWeather(vilageJson)[3];
    searchRainForTime=extractVilageWeather(searchJson)[3];

    // 6,9,12,15,18,21시 습도
    currentHumidityForTime=extractVilageWeather(vilageJson)[4];
    searchHumidityForTime=extractVilageWeather(searchJson)[4];
    const currentHumidityList=makeData(currentHumidityForTime);
    const searchHumidityList=makeData(searchHumidityForTime);

    const currentSensoryData = makeSensoryData(currentTmpList,currentHumidityList);
    const searchSensoryData = makeSensoryData(searchTmpList,searchHumidityList);

    const dataForTmp = {
      labels: ["6시", "9시", "12시", "15시", "18시", "21시"],
      datasets : [
        {
          data: makeData(currentTmpForTime),
          color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // 첫 번째 데이터 세트의 색상
          strokeWidth: 2 // 첫 번째 데이터 세트의 선 두께
        },
        {
          data: makeData(searchTmpForTime),
          color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`, // 두 번째 데이터 세트의 색상
          strokeWidth: 2 // 두 번째 데이터 세트의 선 두께
        }
      ],
      legend: ["시간대별 기온 비교"] // optional
    };

    const dataForWind = {
      labels: ["6시", "9시", "12시", "15시", "18시", "21시"],
      datasets : [
        {
          data: makeData(currentWindForTime),
          color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // 첫 번째 데이터 세트의 색상
          strokeWidth: 2 // 첫 번째 데이터 세트의 선 두께
        },
        {
          data: makeData(searchWindForTime),
          color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`, // 두 번째 데이터 세트의 색상
          strokeWidth: 2 // 두 번째 데이터 세트의 선 두께
        }
      ],
      legend: ["시간대별 풍속 비교"] // optional
    };

    const dataForRain = {
      labels: ["6시", "9시", "12시", "15시", "18시", "21시"],
      datasets : [
        {
          data: makeData(currentRainForTime),
          color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // 첫 번째 데이터 세트의 색상
          strokeWidth: 2 // 첫 번째 데이터 세트의 선 두께
        },
        {
          data: makeData(searchRainForTime),
          color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`, // 두 번째 데이터 세트의 색상
          strokeWidth: 2 // 두 번째 데이터 세트의 선 두께
        }
      ],
      legend: ["시간대별 강수량 비교"] // optional
    };

    const dataForSensory = {
      labels: ["6시", "9시", "12시", "15시", "18시", "21시"],
      datasets : [
        {
          data: currentSensoryData,
          color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // 첫 번째 데이터 세트의 색상
          strokeWidth: 2 // 첫 번째 데이터 세트의 선 두께
        },
        {
          data: searchSensoryData,
          color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`, // 두 번째 데이터 세트의 색상
          strokeWidth: 2 // 두 번째 데이터 세트의 선 두께
        }
      ],
      legend: ["시간대별 체감온도 비교"] // optional
    };

    // console.log("data 확인",data.datasets[0].data);
    setTempData(dataForTmp);
    setWindData(dataForWind);
    setRainData(dataForRain);
    setSensoryData(dataForSensory);
    setIsLoading(false); // 데이터 로딩 완료 상태 설정

  
  };

  useEffect(() => {
    getWeather();
    compareWeather();
  }, []);

  if (!tempData) {
    // tempData가 아직 초기화되지 않았을 경우 로딩 중 표시 등을 할 수 있습니다.
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light"></StatusBar>
      <View style={styles.city}>
        <Text style={styles.cityName}>{city} {subregion} {district}</Text>
      </View>
      
      {/* {tempData && (
      <LineChart
        data={tempData}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
      />
      )}
      {windData && (
        <LineChart
          data={windData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
        />
      )}   */}
      <ScrollView
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        horizontal 
        contentContainerStyle={styles.weather}
      >
        <View style={styles.day}>
        {isLoading ? (
        <Text>Loading...</Text> // 로딩 상태 표시
        ) : (
          <>{tempData && (
            <LineChart
              data={tempData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
            />)} 
          </>
        )}
          <Text style={styles.temp}>{TEMP}</Text>
          <Text style={styles.description}>{SKY}</Text>
        </View>
        <View style={styles.day}>
        {isLoading ? (
        <Text>Loading...</Text> // 로딩 상태 표시
      ) : (
        <>
          {windData && (
          <LineChart
            data={windData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
          />
          )}  
        </>
      )}
          <Text style={styles.temp}>{lowerTEMP}</Text>
          <Text style={styles.description}>{upperTEMP}</Text>
        </View>
        <View style={styles.day}>
        {isLoading ? (
        <Text>Loading...</Text> // 로딩 상태 표시
      ) : (
        <>
          {rainData && (
          <LineChart
            data={rainData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
          />
          )}  
        </>
      )}
          <Text style={styles.temp}>미세먼지 등급 </Text>
          <Text style={styles.description}>{pmGrade10}</Text>
        </View>
        <View style={styles.day}>
        {isLoading ? (
        <Text>Loading...</Text> // 로딩 상태 표시
        ) : (
          <>{sensoryData && (
            <LineChart
              data={sensoryData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
            />)} 
          </>
        )}
          <Text style={styles.temp}>초미세먼지 등급</Text>
          <Text style={styles.description}>{pmGrade25}</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>미세먼지 농도</Text>
          <Text style={styles.description}>{pmValue10}</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>초미세먼지 농도</Text>
          <Text style={styles.description}>{pmValue25}</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>체감온도</Text>
          <Text style={styles.description}>{sensoryTEMP}</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>풍속</Text>
          <Text style={styles.description}>{wind}</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>강수량</Text>
          <Text style={styles.description}>{rainfall}</Text>
        </View>
        <View style={{ flex: 1, padding: 16 }}>
        <TextInput
          style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 16 }}
          placeholder="지역명을 입력하세요"
          value={locationName}
          onChangeText={text => setLocationName(text)}
        />
        <Button title="검색" onPress={searchLocation} />
        {searchLatitude !== '' && searchLongitude !== '' && (
          <View style={{ marginTop: 16 }}>
            <Text>위도: {searchLatitude}</Text>
            <Text>경도: {searchLongitude}</Text>
        </View>
      )}
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
    width:screenWidth,
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