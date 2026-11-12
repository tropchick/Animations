import {ThreeStories} from './ThreeStories';
import {ThreeCover} from './ThreeCover';
import React from 'react';
import {GorCover, GorLab, Gorilla100} from './Gorilla100';
import {DURATION_S as GOR_S} from './gor/cues';
import {Composition} from 'remotion';
import {AirGone} from './AirGone';
import {GravityFlip} from './GravityFlip';
import {DURATION_S, FPS} from './timeline';
import {DURATION_S as GRAVITY_S} from './gravity/time';
import {SlimeEp1} from './SlimeEp1';
import {SlimeCover} from './SlimeCover';
import {DURATION_S as SLIME_S} from './slime/cues';
import {SlimeEp2} from './SlimeEp2';
import {DURATION_S as SLIME2_S} from './slime/ep2/cues';
import {LastEp1} from './LastEp1';
import {LastDebug} from './last/Debug';
import {BearLab} from './BearLab';
import {QuietLab} from './QuietLab';
import {QuietFloor} from './QuietFloor';
import {QuietCover} from './QuietCover';
import {DURATION_S as QUIET_S} from './quiet/cues';
import {BearChain} from './BearChain';
import {BearCover} from './BearCover';
import {DURATION_S as BEAR_S} from './bear/cues';
import {LastCover} from './LastCover';
import {DURATION_S as LAST1_S} from './last/cues';
import {SlimeEp3} from './SlimeEp3';
import {DURATION_S as SLIME3_S} from './slime/ep3/cues';
import {PovMrBeast} from './PovMrBeast';
import {PovCover} from './PovCover';
import {DURATION_S as POV_S} from './pov/cues';
import {EarthStop} from './EarthStop';
import {EarthCover} from './EarthCover';
import {DURATION_S as EARTH_S} from './earth/time';
import {GravityGrow} from './GravityGrow';
import {GrowCover, GROW_COVER} from './GrowCover';
import {DURATION_S as GROW_S} from './grow/time';
import {ScpEp1} from './ScpEp1';
import {ScpCover} from './ScpCover';
import {DURATION_S as SCP1_S} from './scp/cues';
import {MurinoEp1} from './MurinoEp1';
import {MurinoCover} from './MurinoCover';
import {DURATION_S as MURINO1_S} from './murino/cues';
import {ChessCover, ChessVideo} from './chess/Breakdown';
import {CHESS_SHOWS} from './chessShows';
import {MashaVideo} from './masha/Masha';
import {ONEVIEW_FRAMES, OneViewCover, OneViewRecord} from './oneview/OneView';
import {BusMeme} from './BusMeme';
import {BusCover} from './BusCover';
import {DURATION_S as BUS_S} from './bus/cues';
import {GtaDelay} from './GtaDelay';
import {GtaTop, GtaTopCover, GTATOP_S} from './gtatop/GtaTop';
import {GtaCover} from './GtaCover';
import {HlToday} from './HlToday';
import {HlCover} from './HlCover';
import {DURATION_S as HL3_S} from './hl3/cues';
import {GtaChain} from './GtaChain';
import {GabenMom} from './GabenMom';
import {DotaChain} from './DotaChain';
import {Cs2Chain} from './Cs2Chain';
import {BrainChain} from './BrainChain';
import {BrainCover} from './BrainCover';
import {DURATION_S as BRAIN_S} from './brain/cues';
import {GtaDay, GtaDayCover} from './GtaDay';
import {DURATION_S as DAY_S} from './day/cues';
import {Cs2Cover} from './Cs2Cover';
import {DURATION_S as CS2_S} from './cs2/cues';
import {DURATION_S as NOLAN_S} from './nolan/cues';
import {NolanMom} from './NolanMom';
import {NolanCover} from './NolanCover';
import {NolanMom2} from './NolanMom2';
import {NolanCover2} from './NolanCover2';
import {DURATION_S as NOLAN2_S} from './nolan2/cues';
import {DotaCover} from './DotaCover';
import {DURATION_S as DOTA_S} from './dota/cues';
import {GabenCover} from './GabenCover';
import {DURATION_S as GABEN_S} from './gaben/cues';
import {ShawaChain} from './ShawaChain';
import {DvizhChain} from './DvizhChain';
import {DvizhCover} from './DvizhCover';
import {DURATION_S as DVIZH_S} from './dvizh/cues';
import {SunOut} from './SunOut';
import {SnowSpring} from './SnowSpring';
import {WoodyBanner} from './WoodyBanner';
import {FRAMES as WOODY_FRAMES} from './woody/cues';
import {SnowCover} from './SnowCover';
import {STORY_FRAMES as SNOW_FRAMES} from './snow/data';
import {SunCover} from './SunCover';
import {LastMan} from './LastMan';
import {LastManCover} from './LastManCover';
import {AiFour} from './AiFour';
import {AiCover} from './AiCover';
import {DURATION_S as AI4_S} from './ai4/cues';
import {DURATION_S as LASTMAN_S} from './lastman/cues';
import {DURATION_S as SUN_S} from './sun/cues';
import {ShawaCover} from './ShawaCover';
import {DURATION_S as SHAWA_S} from './shawa/cues';
import {DURATION_S as GTA2_S} from './gta2/cues';
import {DURATION_S as GTA_S} from './gta/cues';
import {DietMom} from './DietMom';
import {GtaMom} from './GtaMom';
import {GtaMomCover} from './GtaMomCover';
import {DURATION_S as GTAMOM_S} from './gtamom/cues';
import {Hl3Gta} from './Hl3Gta';
import {Hl3GtaCover} from './Hl3GtaCover';
import {DURATION_S as HL3GTA_S} from './hl3gta/cues';
import {DURATION_S as BEAST_S} from './beast/cues';
import {BeastRich} from './BeastRich';
import {BeastCover} from './BeastCover';
import {DietCover} from './DietCover';
import {CheatsChain} from './CheatsChain';
import {CheatsCover} from './CheatsCover';
import {DURATION_S as CHEATS_S} from './cheats/cues';
import {DURATION_S as DIET_S} from './diet/cues';

// the «Шахматный разбор» videos: composition ids and their show
const CHESS = [
  {id: 'SlobodyChess', cover: 'SlobodyCover', show: 'slobody'},
  {id: 'KnigaChess', cover: 'KnigaCover', show: 'kniga'},
  {id: 'MinutochkaChess', cover: 'MinutochkaCover', show: 'minutochka'},
  {id: 'KotlyChess', cover: 'KotlyCover', show: 'kotly'},
  {id: 'GelodiChess', cover: 'GelodiCover', show: 'gelodi'},
  {id: 'RifmaChess', cover: 'RifmaCover', show: 'rifma'},
  {id: 'OdetyChess', cover: 'OdetyCover', show: 'odety'},
  {id: 'KlimChess', cover: 'KlimCover', show: 'klim'},
  {id: 'KreditChess', cover: 'KreditCover', show: 'kredit'},
  {id: 'PaltoChess', cover: 'PaltoCover', show: 'palto'},
  {id: 'KosheyChess', cover: 'KosheyCover', show: 'koshey'},
  {id: 'GeniyChess', cover: 'GeniyCover', show: 'geniy'},
  {id: 'GlazaChess', cover: 'GlazaCover', show: 'glaza'},
  {id: 'MashaChess', cover: 'MashaCover', show: 'masha'},
  {id: 'GydriChess', cover: 'GydriCover', show: 'gydri'},
  {id: 'HartmanChess', cover: 'HartmanCover', show: 'hartman'},
  {id: 'AdidasChess', cover: 'AdidasCover', show: 'adidas'},
];

export const RemotionRoot = () => (
  <>
    <Composition id="ThreeStories" component={ThreeStories} durationInFrames={1711} fps={30} width={1080} height={1920} defaultProps={{withAudio: false}} />
    <Composition id="ThreeCover" component={ThreeCover} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="GtaTop" component={GtaTop} durationInFrames={Math.round(GTATOP_S * FPS) + 1} fps={FPS} width={1080} height={1920} defaultProps={{withAudio: true}} />
    <Composition id="GtaTopCover" component={GtaTopCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="OneViewRecord" component={OneViewRecord} durationInFrames={ONEVIEW_FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{withAudio: false}} />
    <Composition id="OneViewCover" component={OneViewCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    {CHESS.map(({id, cover, show}) => (
      <React.Fragment key={id}>
        <Composition
          id={id}
          component={show === 'masha' ? MashaVideo : ChessVideo}
          durationInFrames={Math.round(CHESS_SHOWS[show].DURATION_S * FPS) + 1}
          fps={FPS}
          width={1080}
          height={1920}
          defaultProps={{id: show, withAudio: false}}
        />
        <Composition id={cover} component={ChessCover} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{id: show}} />
      </React.Fragment>
    ))}
    <Composition
      id="MurinoEp1"
      component={MurinoEp1}
      durationInFrames={Math.round(MURINO1_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="MurinoCover" component={MurinoCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="BusMeme"
      component={BusMeme}
      durationInFrames={Math.round(BUS_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="BusCover" component={BusCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="GtaDelay"
      component={GtaDelay}
      durationInFrames={Math.round(GTA_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="GtaCover" component={GtaCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="HlCover" component={HlCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="HlToday"
      component={HlToday}
      durationInFrames={Math.round(HL3_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="ShawaCover" component={ShawaCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="DvizhCover" component={DvizhCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="SnowCover" component={SnowCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="SnowSpring"
      component={SnowSpring}
      durationInFrames={SNOW_FRAMES + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition
      id="WoodyBanner"
      component={WoodyBanner}
      durationInFrames={WOODY_FRAMES}
      fps={FPS}
      width={1920}
      height={960}
      defaultProps={{withAudio: false}}
    />
    <Composition id="AiCover" component={AiCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="AiFour"
      component={AiFour}
      durationInFrames={Math.round(AI4_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="LastManCover" component={LastManCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="LastMan"
      component={LastMan}
      durationInFrames={Math.round(LASTMAN_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="SunCover" component={SunCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="SunOut"
      component={SunOut}
      durationInFrames={Math.round(SUN_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition
      id="DvizhChain"
      component={DvizhChain}
      durationInFrames={Math.round(DVIZH_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition
      id="ShawaChain"
      component={ShawaChain}
      durationInFrames={Math.round(SHAWA_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition
      id="Gorilla100"
      component={Gorilla100}
      durationInFrames={Math.round(GOR_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="Gorilla100Cover" component={GorCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="GorLab" component={GorLab} durationInFrames={300} fps={FPS} width={1080} height={1920} />
    <Composition id="BeastCover" component={BeastCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="BeastRich"
      component={BeastRich}
      durationInFrames={Math.round(BEAST_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="Hl3GtaCover" component={Hl3GtaCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="Hl3Gta"
      component={Hl3Gta}
      durationInFrames={Math.round(HL3GTA_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="GtaMomCover" component={GtaMomCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="GtaMom"
      component={GtaMom}
      durationInFrames={Math.round(GTAMOM_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="DietCover" component={DietCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="DietMom"
      component={DietMom}
      durationInFrames={Math.round(DIET_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="NolanCover" component={NolanCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="NolanMom"
      component={NolanMom}
      durationInFrames={Math.round(NOLAN_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="NolanCover2" component={NolanCover2} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="NolanMom2"
      component={NolanMom2}
      durationInFrames={Math.round(NOLAN2_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="GtaDayCover" component={GtaDayCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="GtaDay"
      component={GtaDay}
      durationInFrames={Math.round(DAY_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="CheatsCover" component={CheatsCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="CheatsChain"
      component={CheatsChain}
      durationInFrames={Math.round(CHEATS_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="BrainCover" component={BrainCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="BrainChain"
      component={BrainChain}
      durationInFrames={Math.round(BRAIN_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="Cs2Cover" component={Cs2Cover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="Cs2Chain"
      component={Cs2Chain}
      durationInFrames={Math.round(CS2_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="DotaCover" component={DotaCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="DotaChain"
      component={DotaChain}
      durationInFrames={Math.round(DOTA_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="GabenCover" component={GabenCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="GabenMom"
      component={GabenMom}
      durationInFrames={Math.round(GABEN_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition
      id="GtaChain"
      component={GtaChain}
      durationInFrames={Math.round(GTA2_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition
      id="ScpEp1"
      component={ScpEp1}
      durationInFrames={Math.round(SCP1_S * FPS) + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="ScpCover" component={ScpCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="GravityGrow"
      component={GravityGrow}
      durationInFrames={GROW_S * FPS + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="GrowCover" component={GrowCover} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={GROW_COVER} />
    <Composition
      id="EarthStop"
      component={EarthStop}
      durationInFrames={EARTH_S * FPS}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition
      id="EarthCover"
      component={EarthCover}
      durationInFrames={1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{v: 31.2, view: {pos: [-24, 1.6, 6.4], target: [-26, 40, -14], fov: 66}}}
    />
    <Composition id="AirGone" component={AirGone} durationInFrames={DURATION_S * FPS} fps={FPS} width={1080} height={1920} />
    <Composition
      id="GravityFlip"
      component={GravityFlip}
      durationInFrames={GRAVITY_S * FPS}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: true}}
    />
    <Composition
      id="SlimeEp1"
      component={SlimeEp1}
      durationInFrames={Math.round(SLIME_S * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: true}}
    />
    <Composition
      id="SlimeEp2"
      component={SlimeEp2}
      durationInFrames={Math.round(SLIME2_S * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: true}}
    />
    <Composition
      id="SlimeEp3"
      component={SlimeEp3}
      durationInFrames={Math.round(SLIME3_S * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: true}}
    />
    <Composition id="SlimeCover" component={SlimeCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="SlimeCover2"
      component={SlimeCover}
      durationInFrames={1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{episode: 2, title: 'ПЕРВЫЕ СУТКИ', line: 'ТУТ ПОЛ МЯГКИЙ'}}
    />
    <Composition
      id="LastEp1"
      component={LastEp1}
      durationInFrames={Math.round(LAST1_S * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: true}}
    />
    <Composition
      id="PovMrBeast"
      component={PovMrBeast}
      durationInFrames={Math.round(POV_S * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: true}}
    />
    <Composition id="LastCover" component={LastCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="LastDebug" component={LastDebug} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{v: 0}} />
    <Composition id="QuietFloor" component={QuietFloor} durationInFrames={Math.round(QUIET_S * FPS) + 1} fps={FPS} width={1080} height={1920} defaultProps={{withAudio: false}} />
    <Composition id="QuietCover" component={QuietCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="QuietLab" component={QuietLab} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{}} />
    <Composition id="BearLab" component={BearLab} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{}} />
    <Composition id="BearCover" component={BearCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="BearChain" component={BearChain} durationInFrames={Math.round(BEAR_S * FPS) + 1} fps={FPS} width={1080} height={1920} defaultProps={{withAudio: false}} />
    <Composition
      id="SlimeCover3"
      component={SlimeCover}
      durationInFrames={1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{episode: 3, title: 'ГОРОД', line: 'ВСЕ КАНАЛЫ МОЛЧАТ'}}
    />
    <Composition id="PovCover" component={PovCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);
