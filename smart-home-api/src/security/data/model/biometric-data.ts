// biometric-data.dto.ts
import {
  IsArray, ArrayMinSize, ArrayMaxSize, IsNumber,
  IsString, IsIn, IsInt, Equals, IsBoolean
} from 'class-validator';

export class BiometricData {
  @IsArray()
  @ArrayMinSize(512)
  @ArrayMaxSize(512)
  @IsNumber({}, { each: true })
  vector!: number[]; // 512 floats L2-normalisés

  @IsString()
  @IsIn(['arcface-w600k-mbf'])
  model: 'arcface-w600k-mbf' = 'arcface-w600k-mbf';

  @IsInt()
  @Equals(512)
  dim: number = 512;

  @IsBoolean()
  @Equals(true)
  normalized: boolean = true;
}